const {
  StepsTracker,
  HeartRateTracker,
  Spo2Tracker,
  SleepTracker,
  WaterTracker,
  WeightTracker,
  CaloriesTracker,
} = require("../models/trackerModels");

const LATEST_RECORD_SORT = { recordedAt: -1, createdAt: -1, _id: -1 };
const HISTORY_RECORD_LIMIT = 30;
const HISTORY_CONFIG = {
  steps: { Model: StepsTracker, valueField: "value" },
  heartrate: { Model: HeartRateTracker, valueField: "value" },
  spo2: { Model: Spo2Tracker, valueField: "value" },
  sleep: { Model: SleepTracker, valueField: "duration" },
  water: { Model: WaterTracker, valueField: "value" },
  weight: { Model: WeightTracker, valueField: "value" },
};

const findLatestValueByPatient = async (Model, patientId) => {
  const record = await Model.findOne({ patientId }).sort(LATEST_RECORD_SORT).select("value").lean();
  return record ? record.value : null;
};

const findLatestSleepDurationByPatient = async (patientId) => {
  const record = await SleepTracker.findOne({ patientId })
    .sort(LATEST_RECORD_SORT)
    .select("duration")
    .lean();

  return record ? record.duration : null;
};

const getAnalyticsSummaryByPatient = async (patientId) => {
  const [
    latestSteps,
    latestHeartRate,
    latestSpo2,
    latestWeight,
    latestWater,
    latestCalories,
    lastSleepDuration,
  ] = await Promise.all([
    findLatestValueByPatient(StepsTracker, patientId),
    findLatestValueByPatient(HeartRateTracker, patientId),
    findLatestValueByPatient(Spo2Tracker, patientId),
    findLatestValueByPatient(WeightTracker, patientId),
    findLatestValueByPatient(WaterTracker, patientId),
    findLatestValueByPatient(CaloriesTracker, patientId),
    findLatestSleepDurationByPatient(patientId),
  ]);

  return {
    latestSteps,
    latestHeartRate,
    latestSpo2,
    latestWeight,
    latestWater,
    latestCalories,
    lastSleepDuration,
  };
};

const getAnalyticsHistoryByPatient = async (metric, patientId) => {
  const historyConfig = HISTORY_CONFIG[metric];

  if (!historyConfig) {
    throw new Error(`Unsupported analytics metric: ${metric}`);
  }

  const { Model, valueField } = historyConfig;
  const records = await Model.find({ patientId })
    .sort(LATEST_RECORD_SORT)
    .limit(HISTORY_RECORD_LIMIT)
    .select(`${valueField} recordedAt`)
    .lean();

  return records.reverse().map((record) => ({
    value: record[valueField],
    recordedAt: record.recordedAt,
  }));
};

module.exports = {
  getAnalyticsHistoryByPatient,
  getAnalyticsSummaryByPatient,
};
