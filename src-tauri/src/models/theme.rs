use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>, // Optional for backward compatibility, may match parent
    pub title: HashMap<String, String>, // Localized title
    pub body1: HashMap<String, String>, // Localized body text 1
    pub body2: HashMap<String, String>, // Localized body text 2
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>, // image URL
    pub schedule_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeListItem {
    pub id: String,
    pub content: Theme,
}
