using SQLite;

namespace Recorder.Core
{
    /// <summary>
    /// Database configuration constants.
    /// </summary>
    public static class DatabaseConstants
    {
        /// <value>Creation flags for the local SQLite database.</value>
        public const SQLiteOpenFlags DatabaseFlags =
            SQLiteOpenFlags.ReadWrite |  // open the database in read/write mode
            SQLiteOpenFlags.Create |     // create the database if it doesn't exist
            SQLiteOpenFlags.SharedCache; // enable multi-threaded database access
    }
}
