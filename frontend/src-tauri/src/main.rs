// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    success: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
}

// Global state for backend process
static BACKEND_STARTED: AtomicBool = AtomicBool::new(false);
static BACKEND_PROCESS: Mutex<Option<std::process::Child>> = Mutex::new(None);

// Function to start the Python backend
async fn start_backend() -> Result<(), String> {
    if BACKEND_STARTED.load(Ordering::Relaxed) {
        return Ok(());
    }

    // First, check if backend is already running
    let client = reqwest::Client::new();
    match client.get("http://127.0.0.1:8000/pcc").timeout(Duration::from_secs(2)).send().await {
        Ok(_) => {
            println!("Backend is already running - using existing backend");
            BACKEND_STARTED.store(true, Ordering::Relaxed);
            return Ok(());
        }
        Err(e) => {
            println!("Backend not running ({}), starting Python backend server...", e);
        }
    }

    // Get the backend directory path - try multiple possible locations
    let possible_paths = vec![
        // Bundled backend path (in app bundle)
        std::env::current_dir()
            .unwrap()
            .join("Contents/Resources/backend"),
        // Development path
        std::env::current_dir()
            .unwrap()
            .parent()
            .unwrap()
            .join("backend"),
        // Built app path
        std::env::current_dir().unwrap().join("backend"),
        // Alternative built app path
        std::env::current_dir().unwrap().join("../backend"),
    ];

    let backend_path = possible_paths
        .iter()
        .find(|path| path.exists())
        .ok_or("Backend directory not found. Please ensure the backend folder exists.")?;

    println!("Using backend path: {:?}", backend_path);

    // Determine Python command
    let python_cmd = if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    };

    // Start the backend server
    let child = Command::new(python_cmd)
        .arg("-m")
        .arg("uvicorn")
        .arg("app.main:app")
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg("8000")
        .current_dir(&backend_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            format!(
                "Failed to start backend: {}. Make sure Python and uvicorn are installed.",
                e
            )
        })?;

    {
        let mut process_guard = BACKEND_PROCESS.lock().unwrap();
        *process_guard = Some(child);
    }

    BACKEND_STARTED.store(true, Ordering::Relaxed);

    // Wait for server to start and check if it's actually running
    thread::sleep(Duration::from_secs(3));

    // Test if the backend is actually running
    let client = reqwest::Client::new();
    let test_url = "http://127.0.0.1:8000/pcc";

    match client
        .get(test_url)
        .timeout(Duration::from_secs(5))
        .send()
        .await
    {
        Ok(_) => {
            println!("Backend server started successfully and is responding");
            Ok(())
        }
        Err(e) => {
            println!("Backend server failed to start or is not responding: {}", e);
            Err(format!("Backend server is not responding: {}", e))
        }
    }
}

// Function to cleanup backend process
fn cleanup_backend() {
    println!("Cleaning up backend process...");
    {
        let mut process_guard = BACKEND_PROCESS.lock().unwrap();
        if let Some(mut child) = process_guard.take() {
            let _ = child.kill();
            let _ = child.wait();
            println!("Backend process terminated");
        }
    }
    BACKEND_STARTED.store(false, Ordering::Relaxed);
}

#[tauri::command]
async fn call_backend_api(
    endpoint: String,
    data: Option<serde_json::Value>,
    auth_token: Option<String>,
    token: Option<String>,
) -> Result<ApiResponse, String> {
    println!("=== Rust API Call Debug ===");
    println!("Endpoint: {}", endpoint);
    println!("Data provided: {}", data.is_some());
    println!("Auth token provided: {}", auth_token.is_some());
    println!("Auth token value: {:?}", auth_token);
    println!("Token provided: {}", token.is_some());
    println!("Token value: {:?}", token);
    println!("==========================");

    // Start the backend if it's not running
    match start_backend().await {
        Ok(_) => {
            println!("Backend is ready");
        }
        Err(e) => {
            println!("Failed to start backend: {}", e);
            return Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(format!("Backend server is not available. Error: {}", e)),
            });
        }
    }

    // Make HTTP request to the backend
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let url = format!("http://127.0.0.1:8000{}", endpoint);

    // Determine request method and prepare data
    let (request_builder, method, clean_data) = if let Some(request_data) = data {
        // Check if this is a DELETE or PUT request
        let method = request_data
            .get("_method")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Remove _method from the data before sending
        let mut clean_data = request_data.clone();
        clean_data
            .as_object_mut()
            .and_then(|obj| obj.remove("_method"));

        let builder = match method.as_deref() {
            Some("DELETE") => client.delete(&url),
            Some("PUT") => client.put(&url),
            _ => client.post(&url),
        };

        (builder, method, Some(clean_data))
    } else {
        (client.get(&url), None, None)
    };

    // Add authentication header if provided
    let token_to_use = auth_token.as_ref().or(token.as_ref());
    let request_builder = if let Some(token) = token_to_use {
        // Clean the token - remove any quotes that might be present
        let clean_token = token.trim_matches('"');
        println!("Adding auth header: Bearer {}", clean_token);
        request_builder.header("Authorization", format!("Bearer {}", clean_token))
    } else {
        println!("No auth token provided");
        request_builder
    };

    let response = match method.as_deref() {
        Some("DELETE") => {
            println!("Sending DELETE request to: {}", url);
            request_builder.send().await
        }
        Some("PUT") => {
            println!("Sending PUT request to: {}", url);
            if let Some(data) = clean_data {
                request_builder.json(&data).send().await
            } else {
                request_builder.send().await
            }
        }
        _ => {
            if let Some(data) = clean_data {
                println!("Sending POST request to: {}", url);
                request_builder.json(&data).send().await
            } else {
                println!("Sending GET request to: {}", url);
                request_builder.send().await
            }
        }
    };

    match response {
        Ok(resp) => {
            let status = resp.status();
            if status.is_success() {
                let data = resp
                    .json::<serde_json::Value>()
                    .await
                    .map_err(|e| e.to_string())?;
                Ok(ApiResponse {
                    success: true,
                    data: Some(data),
                    error: None,
                })
            } else {
                let error_text = resp.text().await.unwrap_or_default();
                Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("HTTP {}: {}", status, error_text)),
                })
            }
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

fn main() {
    // Set up signal handlers for cleanup
    ctrlc::set_handler(|| {
        cleanup_backend();
        std::process::exit(0);
    }).expect("Error setting Ctrl+C handler");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![call_backend_api])
        .setup(|_app| {
            // Start the backend when the app launches
            tauri::async_runtime::spawn(async {
                if let Err(e) = start_backend().await {
                    eprintln!("Failed to start backend: {}", e);
                }
            });
            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
                cleanup_backend();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
