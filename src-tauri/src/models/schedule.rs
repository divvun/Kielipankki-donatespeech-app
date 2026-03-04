use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Localized content state for media items and prompts
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaState {
    pub title: HashMap<String, String>,
    pub body1: HashMap<String, String>,
    pub body2: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
}

/// Schedule state for start/finish screens
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleState {
    pub title: HashMap<String, String>,
    pub body1: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body2: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schedule_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body1: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body2: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<ScheduleState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finish: Option<ScheduleState>,
    #[serde(default)]
    pub items: Vec<ScheduleItem>,
}

/// Schedule item with polymorphic variants
/// Uses both 'kind' and 'itemType' fields for discrimination
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "itemType", rename_all = "kebab-case")]
pub enum ScheduleItem {
    // Media items
    Audio {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default)]
        options: Vec<serde_json::Value>, // Empty array for media items
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    Video {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default)]
        options: Vec<serde_json::Value>, // Empty array for media items
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    Image {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default)]
        options: Vec<serde_json::Value>, // Empty array for media items
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    Text {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default)]
        options: Vec<serde_json::Value>, // Empty array for media items
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "text-content")]
    TextContent {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "yle-audio")]
    YleAudio {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // YLE program ID
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default)]
        options: Vec<serde_json::Value>, // Empty array for media items
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "yle-video")]
    YleVideo {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // YLE program ID
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        #[serde(default)]
        options: Vec<serde_json::Value>, // Empty array for media items
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    // Fake YLE items (when credentials not configured)
    #[serde(rename = "fake-yle-audio")]
    FakeYleAudio {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // YLE program ID (not decrypted)
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "fake-yle-video")]
    FakeYleVideo {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // YLE program ID (not decrypted)
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    
    // Prompt items
    Choice {
        kind: String, // "prompt"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        options: Vec<HashMap<String, String>>, // Localized answer options
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "multi-choice")]
    MultiChoice {
        kind: String, // "prompt"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        options: Vec<HashMap<String, String>>, // Localized answer options
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(rename = "otherAnswer", skip_serializing_if = "Option::is_none")]
        other_answer: Option<HashMap<String, String>>,
        #[serde(rename = "otherEntryLabel", skip_serializing_if = "Option::is_none")]
        other_entry_label: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "super-choice")]
    SuperChoice {
        kind: String, // "prompt"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        options: Vec<HashMap<String, String>>, // Localized answer options
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(rename = "otherEntryLabel", skip_serializing_if = "Option::is_none")]
        other_entry_label: Option<HashMap<String, String>>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    #[serde(rename = "text-input")]
    TextInput {
        kind: String, // "prompt"
        #[serde(rename = "itemId")]
        item_id: String,
        url: String, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        default: MediaState,
        options: Vec<HashMap<String, String>>, // Localized answer options (may be empty)
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
}
