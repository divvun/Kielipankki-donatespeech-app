use crate::models::schedule::Schedule;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeAvailability {
    pub id: String,
    pub available_languages: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub media_state: crate::models::schedule::MediaState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schedule: Option<Schedule>,
}
