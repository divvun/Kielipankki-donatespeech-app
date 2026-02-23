using System;
using System.IO;
using Recorder.Core.Services;

namespace Recorder.Services
{
    /// <summary>
    /// MAUI implementation of file system provider using Environment.SpecialFolder.
    /// </summary>
    public class MauiFileSystemProvider : IFileSystemProvider
    {
        private const string DatabaseFilename = "Recorder.sqlitedb";

        public string GetDatabasePath()
        {
            var basePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(basePath, DatabaseFilename);
        }
    }
}
