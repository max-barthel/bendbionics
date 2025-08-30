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
async fn call_backend_api(endpoint: String, data: Option<serde_json::Value>) -> Result<ApiResponse, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:8000{}", endpoint);

    let response = if let Some(request_data) = data {
        client.post(&url)
            .json(&request_data)
            .send()
            .await
    } else {
        client.get(&url)
            .send()
            .await
    };

    match response {
        Ok(resp) => {
            if resp.status().is_success() {
                let data = resp.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
                Ok(ApiResponse {
                    success: true,
                    data: Some(data),
                    error: None,
                })
            } else {
                Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("HTTP {}: {}", resp.status(), resp.text().await.unwrap_or_default())),
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
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![call_backend_api])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
