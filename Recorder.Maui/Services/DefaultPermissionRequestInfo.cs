namespace Recorder.Services
{
    public class DefaultPermissionRequestInfo : IPermissionRequestInfo
    {
        public bool IsRetryAllowedForDeniedMicrophone()
        {
            return true;
        }
    }
}
