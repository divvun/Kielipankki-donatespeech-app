namespace Recorder.Core.Services
{
    /// <summary>
    /// Provides platform-specific file system paths.
    /// </summary>
    public interface IFileSystemProvider
    {
        /// <summary>
        /// Gets the full path to the application's database file.
        /// </summary>
        string GetDatabasePath();
    }
}
