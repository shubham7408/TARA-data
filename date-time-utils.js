// Utility functions extracted from the React component

const updateGranularityOptions = () => {
  const options = [
    { granularity: "1 day", maxInterval: "180 days", precision: "-96x" },
    { granularity: "6 hours", maxInterval: "30 days", precision: "-24x" },
    { granularity: "1 hour", maxInterval: "7 days", precision: "-4x" },
    { granularity: "15 minutes", maxInterval: "1 day", precision: "1x" },
    { granularity: "1 minute", maxInterval: "8 hours", precision: "15x" },
    { granularity: "1 second", maxInterval: "1 hour", precision: "900x" },
  ];
  return options;
};

const getGranularityForTimeOption = (option) => {
  switch (option) {
    case "1 Hour":
      return "1 second";
    case "8 Hours":
      return "1 minute";
    case "1 Day":
      return "15 minutes";
    case "7 Days":
      return "1 hour";
    case "30 Days":
      return "6 hours";
    case "180 Days":
      return "1 day";
    default:
      return "1 minute";
  }
};

const handleTimeOptionClick = (option, currentStartDateTime) => {
  const { addHours, addDays } = require("date-fns");

  let updatedEndTime;
  switch (option) {
    case "1 Hour":
      updatedEndTime = addHours(currentStartDateTime, 1);
      break;
    case "8 Hours":
      updatedEndTime = addHours(currentStartDateTime, 8);
      break;
    case "1 Day":
      updatedEndTime = addDays(currentStartDateTime, 1);
      break;
    case "7 Days":
      updatedEndTime = addDays(currentStartDateTime, 7);
      break;
    case "30 Days":
      updatedEndTime = addDays(currentStartDateTime, 30);
      break;
    case "180 Days":
      updatedEndTime = addDays(currentStartDateTime, 180);
      break;
    default:
      updatedEndTime = addHours(currentStartDateTime, 1);
  }

  const newGranularity = getGranularityForTimeOption(option);

  return {
    updatedEndTime,
    newGranularity,
  };
};

module.exports = {
  updateGranularityOptions,
  handleTimeOptionClick,
};
