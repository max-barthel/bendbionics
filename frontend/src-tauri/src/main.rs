// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    success: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
}

#[tauri::command]
async fn call_backend_api(endpoint: String, data: Option<serde_json::Value>, auth_token: Option<String>, token: Option<String>) -> Result<ApiResponse, String> {
    println!("=== Rust API Call Debug ===");
    println!("Endpoint: {}", endpoint);
    println!("Data provided: {}", data.is_some());
    println!("Auth token provided: {}", auth_token.is_some());
    println!("Auth token value: {:?}", auth_token);
    println!("Token provided: {}", token.is_some());
    println!("Token value: {:?}", token);
    println!("==========================");

    let client = reqwest::Client::new();
    let url = format!("http://localhost:8000{}", endpoint);

    let mut request_builder = if data.is_some() {
        client.post(&url)
    } else {
        client.get(&url)
    };

    // Add authentication header if provided
    let token_to_use = auth_token.as_ref().or(token.as_ref());
    if let Some(token) = token_to_use {
        // Clean the token - remove any quotes that might be present
        let clean_token = token.trim_matches('"');
        println!("Adding auth header: Bearer {}", clean_token);
        request_builder = request_builder.header("Authorization", format!("Bearer {}", clean_token));
    } else {
        println!("No auth token provided");
    }

    let response = if let Some(request_data) = data {
        println!("Sending POST request to: {}", url);
        request_builder.json(&request_data).send().await
    } else {
        println!("Sending GET request to: {}", url);
        request_builder.send().await
    };

    match response {
        Ok(resp) => {
            let status = resp.status();
            if status.is_success() {
                let data = resp.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
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
        Err(e) => {
            Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(e.to_string()),
            })
        },
    }
}



fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![call_backend_api])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
