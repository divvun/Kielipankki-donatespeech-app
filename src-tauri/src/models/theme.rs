use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    pub id: Option<String>,
    pub title: HashMap<String, String>, // Localized title
    pub body1: HashMap<String, String>, // Localized body text 1
    pub body2: HashMap<String, String>, // Localized body text 2
    pub image: Option<String>, // image URL
    pub schedule_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeListItem {
    pub id: String,
    pub content: Theme,
}
