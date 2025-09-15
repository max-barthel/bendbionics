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

    // Determine request method and prepare data
    let (request_builder, method, clean_data) = if let Some(request_data) = data {
        // Check if this is a DELETE or PUT request
        let method = request_data.get("_method").and_then(|v| v.as_str()).map(|s| s.to_string());

        // Remove _method from the data before sending
        let mut clean_data = request_data.clone();
        clean_data.as_object_mut().and_then(|obj| obj.remove("_method"));

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
    let mut request_builder = if let Some(token) = token_to_use {
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
