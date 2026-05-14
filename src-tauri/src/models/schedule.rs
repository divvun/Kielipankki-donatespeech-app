use serde::{Deserialize, Serialize};

pub type LocalizedText = String;

/// Localized content state for media items and prompts
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaState {
    pub title: LocalizedText,
    pub body1: LocalizedText,
    pub body2: LocalizedText,
    #[serde(skip_serializing_if = "Option::is_none", alias = "url")]
    pub image_url: Option<String>,
}

/// Schedule state for start/finish screens
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleState {
    pub title: LocalizedText,
    pub body1: LocalizedText,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body2: Option<LocalizedText>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "url")]
    pub image_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleAvailability {
    pub id: String,
    pub available_languages: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schedule_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<LocalizedText>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body1: Option<LocalizedText>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body2: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    Video {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    Image {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
    Text {
        kind: String, // "media"
        #[serde(rename = "itemId")]
        item_id: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>,
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
        #[serde(default)]
        options: Vec<serde_json::Value>,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recording: Option<MediaState>,
        #[serde(skip_serializing_if = "Option::is_none")]
        finish: Option<MediaState>,
        #[serde(rename = "metaTitle", skip_serializing_if = "Option::is_none")]
        meta_title: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // YLE program ID
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // YLE program ID
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // YLE program ID
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // YLE program ID
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
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
        meta_title: Option<LocalizedText>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
        #[serde(default)]
        options: Vec<LocalizedText>,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
        #[serde(default)]
        options: Vec<LocalizedText>,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(rename = "otherAnswer", skip_serializing_if = "Option::is_none")]
        other_answer: Option<LocalizedText>,
        #[serde(rename = "otherEntryLabel", skip_serializing_if = "Option::is_none")]
        other_entry_label: Option<LocalizedText>,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
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
        #[serde(default, skip_serializing_if = "Option::is_none")]
        url: Option<String>, // Image URL for the prompt
        #[serde(rename = "typeId", skip_serializing_if = "Option::is_none")]
        type_id: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        default: Option<MediaState>,
        #[serde(default)]
        options: Vec<LocalizedText>,
        #[serde(rename = "isRecording")]
        is_recording: bool,
        #[serde(rename = "otherEntryLabel", skip_serializing_if = "Option::is_none")]
        other_entry_label: Option<LocalizedText>,
        #[serde(skip_serializing_if = "Option::is_none")]
        start: Option<MediaState>,
        #[serde(default, rename = "startTime")]
        start_time: i32,
        #[serde(default, rename = "endTime")]
        end_time: i32,
    },
}

impl Schedule {
    pub fn normalize_for_client(&mut self) {
        for item in &mut self.items {
            item.normalize_for_client();
        }
    }
}

impl ScheduleItem {
    pub fn normalize_for_client(&mut self) {
        match self {
            ScheduleItem::Audio {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::Video {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::Image {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::TextContent {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::YleAudio {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::YleVideo {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::FakeYleAudio {
                url,
                default,
                start,
                recording,
                finish,
                ..
            }
            | ScheduleItem::FakeYleVideo {
                url,
                default,
                start,
                recording,
                finish,
                ..
            } => normalize_media_item(url, default, start, recording, finish),
            ScheduleItem::Text {
                kind,
                url,
                default,
                start,
                recording,
                finish,
                ..
            } => {
                if kind == "prompt" {
                    normalize_prompt_item(url, default, start);
                } else {
                    normalize_media_item(url, default, start, recording, finish);
                }
            }
            ScheduleItem::Choice {
                url,
                default,
                start,
                ..
            }
            | ScheduleItem::MultiChoice {
                url,
                default,
                start,
                ..
            }
            | ScheduleItem::SuperChoice {
                url,
                default,
                start,
                ..
            } => normalize_prompt_item(url, default, start),
        }
    }
}

fn normalize_media_item(
    url: &mut Option<String>,
    default: &mut Option<MediaState>,
    start: &Option<MediaState>,
    recording: &Option<MediaState>,
    finish: &Option<MediaState>,
) {
    if default.is_none() {
        *default = start
            .clone()
            .or_else(|| recording.clone())
            .or_else(|| finish.clone());
    }

    if url.is_none() {
        *url = default
            .as_ref()
            .and_then(state_url)
            .or_else(|| start.as_ref().and_then(state_url))
            .or_else(|| recording.as_ref().and_then(state_url))
            .or_else(|| finish.as_ref().and_then(state_url));
    }
}

fn normalize_prompt_item(
    url: &mut Option<String>,
    default: &mut Option<MediaState>,
    start: &Option<MediaState>,
) {
    if default.is_none() {
        *default = start.clone();
    }

    if url.is_none() {
        *url = default
            .as_ref()
            .and_then(state_url)
            .or_else(|| start.as_ref().and_then(state_url));
    }
}

fn state_url(state: &MediaState) -> Option<String> {
    state.image_url.clone()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_new_media_shape_and_normalizes_legacy_fields() {
        let mut schedule: Schedule = serde_json::from_value(serde_json::json!({
            "items": [
                {
                    "kind": "media",
                    "itemType": "audio",
                    "itemId": "item-1",
                    "isRecording": true,
                    "start": {
                        "title": "otsikko",
                        "body1": "teksti 1",
                        "body2": "teksti 2",
                        "url": "https://example.invalid/media.mp3"
                    }
                }
            ]
        }))
        .expect("schedule should deserialize");

        schedule.normalize_for_client();

        match &schedule.items[0] {
            ScheduleItem::Audio { url, default, .. } => {
                assert_eq!(url.as_deref(), Some("https://example.invalid/media.mp3"));
                assert_eq!(
                    default
                        .as_ref()
                        .and_then(|state| state.image_url.as_deref()),
                    Some("https://example.invalid/media.mp3")
                );
            }
            _ => panic!("expected audio item"),
        }
    }

    #[test]
    fn deserializes_new_prompt_shape_and_defaults_from_start_state() {
        let mut schedule: Schedule = serde_json::from_value(serde_json::json!({
            "items": [
                {
                    "kind": "prompt",
                    "itemType": "text",
                    "itemId": "item-2",
                    "isRecording": false,
                    "start": {
                        "title": "kysymys",
                        "body1": "selite",
                        "body2": "lisatieto",
                        "url": "https://example.invalid/prompt.png"
                    }
                }
            ]
        }))
        .expect("schedule should deserialize");

        schedule.normalize_for_client();

        match &schedule.items[0] {
            ScheduleItem::Text {
                kind,
                url,
                default,
                options,
                ..
            } => {
                assert_eq!(kind, "prompt");
                assert!(options.is_empty());
                assert_eq!(url.as_deref(), Some("https://example.invalid/prompt.png"));
                assert_eq!(
                    default
                        .as_ref()
                        .and_then(|state| state.image_url.as_deref()),
                    Some("https://example.invalid/prompt.png")
                );
            }
            _ => panic!("expected text item (prompt kind)"),
        }
    }

    #[test]
    fn accepts_legacy_image_url_field_name() {
        let state: MediaState = serde_json::from_value(serde_json::json!({
            "title": "otsikko",
            "body1": "teksti 1",
            "body2": "teksti 2",
            "imageUrl": "https://example.invalid/image.png"
        }))
        .expect("media state should deserialize");

        assert_eq!(
            state.image_url.as_deref(),
            Some("https://example.invalid/image.png")
        );
    }
}
