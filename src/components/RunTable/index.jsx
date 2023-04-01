import React, { useState, useEffect } from 'react';
import { MAIN_COLOR } from 'src/utils/const';
import { formatPace, formatRunTime, sortDateFunc, sortDateFuncReverse } from 'src/utils/utils';
import RunRow from './RunRow';
import styles from './style.module.scss';

const RunTable = ({
  runs,
  year,
  locateActivity,
  setActivity,
  runIndex,
  setRunIndex,
}) => {
  const monthTitles = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "All"];
  const [sortFuncInfo, setSortFuncInfo] = useState('');
  const [month, setMonth] = useState(12);
  const [runsInMonth, setRunsInMonth] = useState([]);
  const [statData, setStatData] = useState({});

  const formatDistance = (dist) => (dist / 1000.0).toFixed(3);

  useEffect(() => {
    onMonthChange(null, month);
  }, [runs]);

  const onMonthChange = (e, m) => {
    const _runsInMonth = runs.filter((run) => {
      return m == 12 || new Date(run.start_date_local.replace(' ', 'T')).getMonth() == m;
    });

    let stat = {
      total: _runsInMonth.length,
      // distance'unit = meter
      distance: _runsInMonth.reduce((pr, v) => pr + v.distance, 0),
      // duration'unit = second
      duration: _runsInMonth.reduce((pr,v) => pr + v.distance / v.average_speed, 0),
    };
    stat.speed = stat.distance / stat.duration;
    stat.runDays = _runsInMonth.map(r => r.start_date_local.split(" ")[0]).filter((v, idx, arr) => arr.indexOf(v) === idx).length;
    const totalHb = _runsInMonth.filter(r => !!r.average_heartrate).reduce((pr, v) => pr + v.average_heartrate * v.distance / v.average_speed, 0);
    const totalHbDuration = _runsInMonth.filter(r => !!r.average_heartrate).reduce((pr, v) => pr + v.distance / v.average_speed, 0);
    stat.hb = totalHb / totalHbDuration;
    stat.distance = formatDistance(stat.distance);

    document.getElementsByClassName(styles.monthLink)[month].style.color = MAIN_COLOR;
    if (e) {
      e.target.style.color = 'red';
    }

    setMonth(m);
    setRunsInMonth(_runsInMonth);
    setStatData(stat);
  };

  const sortKMFunc = (a, b) =>
    sortFuncInfo === 'KM' ? a.distance - b.distance : b.distance - a.distance;
  const sortPaceFunc = (a, b) =>
    sortFuncInfo === 'Pace'
      ? a.average_speed - b.average_speed
      : b.average_speed - a.average_speed;
  const sortBPMFunc = (a, b) =>
    sortFuncInfo === 'BPM'
      ? a.average_heartrate - b.average_heartrate
      : b.average_heartrate - a.average_heartrate;
  const sortRunTimeFunc = (a, b) => {
    if (Number.isNaN(a.distance) || Number.isNaN(b.distance)
      || Number.isNaN(a.average_speed) || Number.isNaN(b.average_speed)) {
      return 0;
    }
    const aDistance = (a.distance / 1000.0).toFixed(3);
    const bDistance = (b.distance / 1000.0).toFixed(3);
    const aPace = (1000.0 / 60.0) * (1.0 / a.average_speed);
    const bPace = (1000.0 / 60.0) * (1.0 / b.average_speed);
    if (sortFuncInfo === 'Time') {
      return aDistance * aPace - bDistance * bPace;
    } else {
      return bDistance * bPace - aDistance * aPace;
    }
  };
  const sortDateFuncClick =
    sortFuncInfo === 'Date' ? sortDateFunc : sortDateFuncReverse;
  const sortFuncMap = new Map([
    ['KM', sortKMFunc],
    ['Pace', sortPaceFunc],
    ['BPM', sortBPMFunc],
    ['Time', sortRunTimeFunc],
    ['Date', sortDateFuncClick],
  ]);
  const handleClick = (e) => {
    const funcName = e.target.innerHTML;
    if (sortFuncInfo === funcName) {
      setSortFuncInfo('');
    } else {
      setSortFuncInfo(funcName);
    }
    const f = sortFuncMap.get(e.target.innerHTML);
    if (runIndex !== -1) {
      const el = document.getElementsByClassName(styles.runRow);
      el[runIndex].style.color = MAIN_COLOR;
    }
    setActivity(runsInMonth.sort(f));
  };

  const isAvalible = (m) => {
    const now = new Date();
    return m == 12 || year < now.getFullYear() || m <= now.getMonth();
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.monthContainer}>
        {monthTitles.map((t, index) => (
          <div key={index} hidden={!isAvalible(index)}><a className={styles.monthLink} onClick={e => onMonthChange(e, index)}>{t}</a></div>
        ))}
      </div>
      <div className={styles.statContainer}>
        <div>次数: {statData.total}</div>
        <div>天数: {statData.runDays}</div>
        <div>距离: {statData.distance}km</div>
        <div>时间: {formatRunTime(statData.distance, statData.speed)}</div>
        <div>配速: {formatPace(statData.speed)}/km</div>
        {!isNaN(statData.hb) &&
        <div>心率: {Math.round(statData.hb)}bpm</div>}
      </div>
      <table className={styles.runTable} cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th />
            {Array.from(sortFuncMap.keys()).map((k) => (
              <th key={k} onClick={(e) => handleClick(e)}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runsInMonth.map((run, index) => (
            <RunRow
              run={run}
              eleIndex={index}
              key={run.run_id}
              locateActivity={locateActivity}
              runIndex={runIndex}
              setRunIndex={setRunIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RunTable;
