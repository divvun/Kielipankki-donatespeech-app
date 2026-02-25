use serde::{Deserialize, Serialize};

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
