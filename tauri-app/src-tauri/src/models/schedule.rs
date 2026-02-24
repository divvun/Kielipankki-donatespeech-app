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

/// Schedule item with polymorphic variants based on itemType discriminator
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "itemType", rename_all = "kebab-case")]
pub enum ScheduleItem {
    // Media items
    Audio(AudioMediaItem),
    Video(VideoMediaItem),
    Image(ImageMediaItem),
    #[serde(rename = "text-content")]
    TextContent(TextContentItem),
    #[serde(rename = "yle-audio")]
    YleAudio(YleAudioMediaItem),
    #[serde(rename = "yle-video")]
    YleVideo(YleVideoMediaItem),
    
    // Prompt items
    Choice(ChoicePromptItem),
    #[serde(rename = "multi-choice")]
    MultiChoice(MultiChoicePromptItem),
    #[serde(rename = "super-choice")]
    SuperChoice(SuperChoicePromptItem),
    #[serde(rename = "text-input")]
    TextInput(TextInputItem),
}

/// Base fields common to all schedule items
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaseScheduleItem {
    pub item_id: String,
    pub description: String,
    pub is_recording: bool,
    #[serde(default)]
    pub start_time: i32,
    #[serde(default)]
    pub end_time: i32,
}

// ============================================================================
// Media Items
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioMediaItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub url: String,
    pub type_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoMediaItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub url: String,
    pub type_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageMediaItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub url: String,
    pub type_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextContentItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub url: String,
    pub type_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YleAudioMediaItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub url: String, // YLE program ID
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YleVideoMediaItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub url: String, // YLE program ID
}

// ============================================================================
// Prompt Items
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChoicePromptItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub options: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiChoicePromptItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub options: Vec<String>,
    pub other_entry_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SuperChoicePromptItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
    pub options: Vec<String>,
    pub other_entry_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextInputItem {
    #[serde(flatten)]
    pub base: BaseScheduleItem,
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
