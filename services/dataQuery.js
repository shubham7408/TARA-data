require("dotenv").config();
const { Client } = require('pg');
const connection = new Client({
  user: process.env.USERNAME,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PG_PORT || 5432,
});

const table = process.env.TABLE_NAME;

const runQuery = async (sql, values) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error(
          "Failed to execute statement due to the following error: " +
            err.message
        );
        reject(new Error(err.message));
      } else {
        resolve(result.rows);
      }
    });
  });
};

const fetchAllSessionData = async (filter) => {
  const query = `WITH PacketData AS (
        SELECT
            SESSION_NAME,
            SUM(UL_LOSTPKTS + DL_LOSTPKTS) AS TOTAL_LOSTPKTS,
            SUM(UL_RXPKTS + DL_RXPKTS) AS TOTAL_RXPKTS,
            (SUM(UL_DVP95 + DL_DVP95) / 2) AS AVG_DELAY_VARIATION
        FROM 
            ${table}
        WHERE
            EPOCH_TIME BETWEEN $1 AND $2
        GROUP BY
            SESSION_NAME
    )
    SELECT
        SESSION_NAME,
        COALESCE((TOTAL_LOSTPKTS / NULLIF(TOTAL_RXPKTS, 0)) * 100, 0) AS PACKET_LOSS,
        AVG_DELAY_VARIATION AS DELAY_VARIATION
    FROM
        PacketData`;

  try {
    // Pass the filter values as bind variables
    const data = await runQuery(query, [filter.sdate, filter.edate]);
    return data;
  } catch (error) {
    console.error("Error fetching data: ", error);
    throw error;
  }
};

const fetchAllSessionName = async () => {
  try {
    // Query to fetch distinct session names
    const queryLanguages = `SELECT DISTINCT SESSION_NAME FROM ${table};`;

    let result = await runQuery(queryLanguages);

    return result;
  } catch (error) {
    console.error("Error executing SQL:", error);
    throw error;
  }
};

const fetchProviderData = async (filter) => {
  try {
    // Query to fetch provider data
    const queryLanguages = `WITH AllData AS (
			SELECT
				PROVIDER,
				SUM(UL_LOSTPKTS + DL_LOSTPKTS) AS TOTAL_LOSTPKTS,
				SUM(UL_RXPKTS + DL_RXPKTS) AS TOTAL_RXPKTS,
				AVG(UL_DVP95 + DL_DVP95) AS AVG_DELAY_VARIATION
			FROM 
				${table}
			WHERE
				EPOCH_TIME BETWEEN $1 AND $2
			GROUP BY
				PROVIDER
		)
		SELECT
			PROVIDER,
			COALESCE((TOTAL_LOSTPKTS / NULLIF(TOTAL_RXPKTS, 0)) * 100, 0) AS PACKET_LOSS,
			AVG_DELAY_VARIATION AS DELAY_VARIATION
		FROM
			AllData;`;

    let result = await runQuery(queryLanguages, [filter.sdate, filter.edate]);

    return result;
  } catch (error) {
    console.error("Error executing SQL:", error);
    throw error;
  }
};

const fetchAllData = async (filter) => {
  const query = `WITH AllData AS (
			SELECT
				SESSION_NAME,
				CITY,
				SOURCE_CITY,
				LATITUDE,
				LONGITUDE,
				SOURCE_LATITUDE,
				SOURCE_LONGITUDE,
				DESTINATION_IP,
				SOURCE_IP,
				SUM(UL_LOSTPKTS + DL_LOSTPKTS) AS TOTAL_LOSTPKTS,
				SUM(UL_RXPKTS + DL_RXPKTS) AS TOTAL_RXPKTS,
				(SUM(UL_DVP95 + DL_DVP95) / 2) AS AVG_DELAY_VARIATION,
				SUM(DL_DMAX + UL_DMAX) AS TOTAL_MAX        
			FROM 
				${table}
			WHERE
				EPOCH_TIME BETWEEN $1 AND $2
			GROUP BY
				SESSION_NAME, CITY, SOURCE_CITY, DESTINATION_IP, SOURCE_IP, LATITUDE, LONGITUDE, SOURCE_LATITUDE, SOURCE_LONGITUDE
		),
		MaxData AS (
			SELECT
				MAX(TOTAL_MAX) AS MAX_TOTAL_MAX
			FROM
				AllData
		)
		SELECT
			A.SESSION_NAME,
			A.CITY,
			A.SOURCE_CITY,
			A.LATITUDE,
			A.LONGITUDE,
			A.SOURCE_LATITUDE,
			A.SOURCE_LONGITUDE,
			A.DESTINATION_IP,
			A.SOURCE_IP,
			TOTAL_LOSTPKTS,
			TOTAL_RXPKTS,
			COALESCE((A.TOTAL_LOSTPKTS / NULLIF(A.TOTAL_RXPKTS, 0)) * 100, 0) AS PACKET_LOSS,
			COALESCE((A.TOTAL_MAX / NULLIF(M.MAX_TOTAL_MAX, 0)) * 100, 0) AS AVG_DELAY,
			A.AVG_DELAY_VARIATION AS DELAY_VARIATION
		FROM
			AllData A
			CROSS JOIN MaxData M;`;

  try {
    const data = await runQuery(query, [filter.sdate, filter.edate]);
    return data;
  } catch (error) {
    console.error("Error fetching data: ", error);
    throw error;
  }
};

const fetchAllDataBurstMax = async (filter, session_name) => {
  let query = `
	  WITH IntervalData AS (
		SELECT
		  SESSION_NAME,
		  DESTINATION_IP,
		  SOURCE_IP,
		  CITY,
		  SOURCE_CITY,
		  LATITUDE,
		  LONGITUDE,
		  SOURCE_LATITUDE,
		  SOURCE_LONGITUDE,
		  TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM EPOCH_TIME) / (6 * 3600)) * 6 * 3600) AS INTERVAL_START,
		  SUM(UL_DMAX + DL_DMAX) AS TOTAL_DMAX,
		  SUM(UL_LOSTBURSTMAX + DL_LOSTBURSTMAX) AS TOTAL_LOST_BURST_MAX,
		  SUM(UL_DVP95 + DL_DVP95) AS TOTAL_DVP95,
		  COUNT(*) AS COUNT
		FROM
		  ${table}
		WHERE `;

  if (session_name !== undefined && session_name !== null) {
    query += `SESSION_NAME = $3 AND `;
  }

  query += `
		  EPOCH_TIME BETWEEN $1 AND $2
		GROUP BY
		  SESSION_NAME,
		  DESTINATION_IP,
		  SOURCE_IP,
		  CITY,
		  SOURCE_CITY,
		  LATITUDE,
		  LONGITUDE,
		  SOURCE_LATITUDE,
		  SOURCE_LONGITUDE,
		  TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM EPOCH_TIME) / (6 * 3600)) * 6 * 3600)
	  )
	  SELECT
		SESSION_NAME,
		DESTINATION_IP,
		SOURCE_IP,
		CITY,
		SOURCE_CITY,
		LATITUDE,
		LONGITUDE,
		SOURCE_LATITUDE,
		SOURCE_LONGITUDE,
		ARRAY_AGG(
		  JSONB_BUILD_OBJECT(
			'INTERVAL_START', INTERVAL_START,
			'DELAY_MAX', COALESCE(TOTAL_DMAX / NULLIF(COUNT, 0), 0),
			'DELAY_VARIATION', COALESCE(TOTAL_DVP95 / NULLIF(COUNT, 0), 0),
			'TOTAL_LOST_BURST_MAX', COALESCE(TOTAL_LOST_BURST_MAX / NULLIF(COUNT, 0), 0)
		  )
		) AS METRICS
	  FROM
		IntervalData
	  GROUP BY
		SESSION_NAME,
		DESTINATION_IP,
		SOURCE_IP,
		CITY,
		SOURCE_CITY,
		LATITUDE,
		LONGITUDE,
		SOURCE_LATITUDE,
		SOURCE_LONGITUDE
	  ORDER BY
		SESSION_NAME,
		DESTINATION_IP,
		SOURCE_IP,
		CITY,
		SOURCE_CITY,
		LATITUDE,
		LONGITUDE,
		SOURCE_LATITUDE,
		SOURCE_LONGITUDE;`;

  try {
    const data = await runQuery(query, [filter.sdate, filter.edate, session_name]);
    return data;
  } catch (error) {
    console.error("Error fetching data: ", error);
    throw error;
  }
};

const fetchFrequentFailed = async (filter) => {
  const query = `
		WITH DailyPacketLoss AS (
		  SELECT
			SESSION_NAME,
			PROVIDER,
			DATE(EPOCH_TIME) AS DATE,
			COALESCE((SUM(UL_LOSTPKTS + DL_LOSTPKTS) / NULLIF(SUM(UL_RXPKTS + DL_RXPKTS), 0)) * 100, 0) AS PACKET_LOSS
		  FROM
			${table}
		  WHERE
			EPOCH_TIME BETWEEN $1 AND $2
		  GROUP BY
			SESSION_NAME, PROVIDER, DATE(EPOCH_TIME)
		),
		ConsecutiveDays AS (
		  SELECT
			SESSION_NAME,
			PROVIDER,
			COUNT(*) AS CONSECUTIVE_DAYS
		  FROM (
			SELECT
			  SESSION_NAME,
			  PROVIDER,
			  DATE,
			  PACKET_LOSS,
			  ROW_NUMBER() OVER (PARTITION BY SESSION_NAME, PROVIDER ORDER BY DATE) AS RN,
			  ROW_NUMBER() OVER (PARTITION BY SESSION_NAME, PROVIDER, (PACKET_LOSS > 1) ORDER BY DATE) AS GRP
			FROM
			  DailyPacketLoss
			WHERE
			  PACKET_LOSS > 1
		  ) SUB
		  GROUP BY
			SESSION_NAME, PROVIDER, (RN - GRP)
		  HAVING
			COUNT(*) >= 3
		)
		SELECT
		  DISTINCT SESSION_NAME,
		  PROVIDER
		FROM
		  SKYLIGHT_MAIN;`;

  try {
    const data = await runQuery(query, [filter.sdate, filter.edate]);
    return data;
  } catch (error) {
    console.error("Error fetching frequent failures: ", error);
    throw error;
  }
};

module.exports = {
  fetchAllSessionName,
  fetchAllSessionData,
  fetchAllData,
  fetchAllDataBurstMax,
  fetchProviderData,
  fetchFrequentFailed,
};
