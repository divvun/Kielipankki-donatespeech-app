using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using SQLite;
using Recorder.Core.Models;
using Recorder.Core.Services;

namespace Recorder.Services
{
    public class AppDatabase : IAppDatabase
    {
        private readonly Lazy<SQLiteAsyncConnection> lazyInitializer;
        private readonly SQLiteAsyncConnection database;
        private bool initialized = false;

        public AppDatabase(IFileSystemProvider fileSystemProvider)
        {
            lazyInitializer = new Lazy<SQLiteAsyncConnection>(() =>
            {
                return new SQLiteAsyncConnection(fileSystemProvider.GetDatabasePath(), Constants.DatabaseFlags);
            });

            database = lazyInitializer.Value;

            // Uses task extension as instructed by Microsoft in their SQLite tutorial:
            // https://docs.microsoft.com/en-us/xamarin/xamarin-forms/data-cloud/data/databases
            InitializeAsync().SafeFireAndForget(false);
        }

        async Task InitializeAsync()
        {
            if (!initialized)
            {
                if (!database.TableMappings.Any(m => m.MappedType.Name == typeof(Recording).Name))
                {
                    //Debug.WriteLine("Creating database tables");
                    await database.CreateTablesAsync(CreateFlags.None, typeof(Recording)).ConfigureAwait(false);
                    initialized = true;
                }
                else
                {
                    Debug.WriteLine("Database is initialized");
                }
            }
            else
            {
                Debug.WriteLine(String.Format("Connected to database at '{0}'", database.DatabasePath));
            }
        }

        public Task<int> GetRecordingCountAsync()
        {
            return database.Table<Recording>().CountAsync();
        }

        public Task<List<Recording>> GetRecordingsAsync()
        {
            var query = database.Table<Recording>();
            return query.ToListAsync();
        }

        public Task<List<Recording>> GetRecordingsByUploadStatusAsync(string uploadStatus)
        {
            var query = database.Table<Recording>().Where(r => r.UploadStatus!.Equals(uploadStatus));
            return query.ToListAsync();
        }

        public Task<Recording> GetRecordingAsync(string recordingId)
        {
            return database.Table<Recording>().Where(i => i.RecordingId == recordingId).FirstOrDefaultAsync();
        }

        public Task<int> SaveRecordingAsync(Recording item)
        {
            Debug.WriteLine(String.Format("Saving item with RecordingID = {0}", item.RecordingId));
            return database.InsertAsync(item);
        }

        public Task<int> DeleteRecordingAsync(Recording item)
        {
            return database.DeleteAsync(item);
        }

        public Task<int> UpdateRecordingUploadStatusAsync(Recording item)
        {
            return database.UpdateAsync(item);
        }

        public void DeleteAllRecordings()
        {
            Debug.WriteLine("About to delete all recordings from the database");
            database.ExecuteScalarAsync<int>("DELETE FROM Recording");
        }
    }

    public class UploadStatus
    {
        public static readonly string Unknown = "unknown";
        public static readonly string Pending = "pending";
        public static readonly string Uploaded = "uploaded";
        public static readonly string Deleted = "deleted";

        private UploadStatus() { }
    }
}
