namespace Recorder.Core.Models
{
    /// <summary>
    /// Constants representing the upload status of a recording in the database.
    /// </summary>
    public class UploadStatus
    {
        public static readonly string Unknown = "unknown";
        public static readonly string Pending = "pending";
        public static readonly string Uploaded = "uploaded";
        public static readonly string Deleted = "deleted";

        private UploadStatus() { }
    }
}
