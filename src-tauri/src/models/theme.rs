use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    pub id: Option<String>,
    pub content: Option<ThemeContent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeContent {
    pub description: Option<String>,
    pub image: Option<String>, // image URL
    pub schedule_ids: Option<Vec<String>>,
}
