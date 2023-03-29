import React, { useState, useEffect } from 'react';
import { MAIN_COLOR } from 'src/utils/const';
import { formatRunTime, sortDateFunc, sortDateFuncReverse } from 'src/utils/utils';
import { formatPace } from '../../utils/utils';
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

  const formatDistance = (dist, unit=0) => (dist / 1000.0).toFixed(1) + unit;

  useEffect(() => {
    onMonthChange(null, month);
  }, [runs]);

  const onMonthChange = (e, m) => {
    const _runsInMonth = runs.filter((run) => {
      return m == 12 || new Date(run.start_date_local.replace(' ', 'T')).getMonth() == m;
    });

    let stat = {
      total: _runsInMonth.length,
      distance: formatDistance(_runsInMonth.reduce((pr, v) => pr + v.distance, 0)),
      duration: _runsInMonth.reduce((pr,v) => pr + formatRunTime(formatDistance(v.distance), v.average_speed, 0), 0),
    };
    stat.pace = formatPace(stat.distance < 0.1 ? 0 : (stat.distance * 1000) / (stat.duration * 60));
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
    const aDistance = (a.distance / 1000.0).toFixed(1);
    const bDistance = (b.distance / 1000.0).toFixed(1);
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
        <div>runs:{statData.total}</div>
        <div>distance:{statData.distance}km</div>
        <div>duration:{statData.duration}min</div>
        <div>pace:{statData.pace}/km</div>
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
