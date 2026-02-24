use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub id: Option<String>,
    pub schedule_id: Option<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub items: Vec<ScheduleItem>,
}

/// Schedule item with polymorphic variants using inline structs
/// The itemType field acts as the discriminator for JSON deserialization
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "itemType", rename_all = "kebab-case")]
pub enum ScheduleItem {
    // Media items
    Audio {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        url: String,
        #[serde(rename = "typeId")]
        type_id: String,
    },
    Video {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        url: String,
        #[serde(rename = "typeId")]
        type_id: String,
    },
    Image {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        url: String,
        #[serde(rename = "typeId")]
        type_id: String,
    },
    #[serde(rename = "text-content")]
    TextContent {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        url: String,
        #[serde(rename = "typeId")]
        type_id: Option<String>,
    },
    #[serde(rename = "yle-audio")]
    YleAudio {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        url: String, // YLE program ID
    },
    #[serde(rename = "yle-video")]
    YleVideo {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        url: String, // YLE program ID
    },
    
    // Prompt items
    Choice {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        options: Vec<String>,
    },
    #[serde(rename = "multi-choice")]
    MultiChoice {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        options: Vec<String>,
        #[serde(rename = "otherEntryLabel")]
        other_entry_label: Option<String>,
    },
    #[serde(rename = "super-choice")]
    SuperChoice {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
        options: Vec<String>,
        #[serde(rename = "otherEntryLabel")]
        other_entry_label: Option<String>,
    },
    #[serde(rename = "text-input")]
    TextInput {
        #[serde(rename = "itemId")]
        item_id: String,
        description: String,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
}

impl ScheduleItem {
    /// Get the item_id regardless of variant
    pub fn item_id(&self) -> &str {
        match self {
            ScheduleItem::Audio { item_id, .. } => item_id,
            ScheduleItem::Video { item_id, .. } => item_id,
            ScheduleItem::Image { item_id, .. } => item_id,
            ScheduleItem::TextContent { item_id, .. } => item_id,
            ScheduleItem::YleAudio { item_id, .. } => item_id,
            ScheduleItem::YleVideo { item_id, .. } => item_id,
            ScheduleItem::Choice { item_id, .. } => item_id,
            ScheduleItem::MultiChoice { item_id, .. } => item_id,
            ScheduleItem::SuperChoice { item_id, .. } => item_id,
            ScheduleItem::TextInput { item_id, .. } => item_id,
        }
    }

    /// Check if this is a media item (vs prompt item)
    pub fn is_media(&self) -> bool {
        matches!(
            self,
            ScheduleItem::Audio { .. }
                | ScheduleItem::Video { .. }
                | ScheduleItem::Image { .. }
                | ScheduleItem::TextContent { .. }
                | ScheduleItem::YleAudio { .. }
                | ScheduleItem::YleVideo { .. }
        )
    }

    /// Check if this is a prompt item (vs media item)
    pub fn is_prompt(&self) -> bool {
        !self.is_media()
    }
}

// ============================================================================
// Schedule Item State
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleItemState {
    pub title: Option<HashMap<String, String>>,
    pub body1: Option<HashMap<String, String>>,
    pub body2: Option<HashMap<String, String>>,
    pub image_url: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScheduleItemStateType {
    Start,
    Recording,
    Finish,
}
