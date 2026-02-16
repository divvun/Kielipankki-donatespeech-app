using System;
using Moq;
using Recorder.Models;
using Recorder.Services;
using Recorder.ViewModels;
using Xunit;

namespace RecorderTests.ViewModels
{
    public class ScheduleItemViewModelTests
    {
        Mock<IAppRepository> mockRepo;

        public ScheduleItemViewModelTests()
        {
            mockRepo = new Mock<IAppRepository>();
        }

        [Fact]
        public void AnswerInitializedFromPrevious()
        {
            string previousAnswer = "test_answer";
            ScheduleItem item = TextPromptItem.Build();

            mockRepo.Setup(r => r.GetAnswer(item.ItemId))
                .Returns(previousAnswer);

            ScheduleItemViewModel model = new ScheduleItemViewModel(item, mockRepo.Object);

            Assert.Equal(previousAnswer, model.Answer);
        }

        [Fact]
        public void VideoResetInvokedOnChangeToStart()
        {
            ScheduleItem item = VideoItem
                .WithRecordingEnabled(true)
                .Build();

            ScheduleItemViewModel model = new ScheduleItemViewModel(item, mockRepo.Object);
            model.ItemDisplayState = ScheduleItemStateType.Finish;
            
            Assert.Raises<EventArgs>(
                attach: handler => model.VideoReset += handler,
                detach: handler => model.VideoReset -= handler,
                testCode: () => model.ItemDisplayState = ScheduleItemStateType.Start
                );
        }

        [Fact]
        public void NonRecordingVideoHasAutoPlay()
        {
            ScheduleItem item = VideoItem
                .WithRecordingEnabled(false)
                .Build();

            ScheduleItemViewModel model = new ScheduleItemViewModel(item, mockRepo.Object)
            {
                ItemDisplayState = ScheduleItemStateType.Start
            };

            Assert.True(model.VideoPlay);
        }

        [Fact]
        public void VideoImageNullWhenNotDefined()
        {
            ScheduleItem item = VideoItem
                .Build();

            ScheduleItemViewModel model = new ScheduleItemViewModel(item, mockRepo.Object);

            model.ItemDisplayState = ScheduleItemStateType.Start;            
            Assert.Null(model.VideoItemImageUrl);

            model.ItemDisplayState = ScheduleItemStateType.Recording;
            Assert.Null(model.VideoItemImageUrl);

            model.ItemDisplayState = ScheduleItemStateType.Finish;
            Assert.Null(model.VideoItemImageUrl);
        }

        private ScheduleItemBuilder TextPromptItem => new ScheduleItemBuilder()
            .WithType(ItemTypeValue.TextInput);

        private static ScheduleItemBuilder VideoItem => new ScheduleItemBuilder()
            .WithType(ItemTypeValue.Video);
    }
}
