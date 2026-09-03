const PHOENIX_OFFSET = '-07:00';

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid calendar date: ${value}`);
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return date;
}

function addDays(value, days) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function datesInclusive(startDate, endDate) {
  const dates = [];
  for (let value = startDate; value <= endDate; value = addDays(value, 1)) dates.push(value);
  if (dates.at(-1) !== endDate) throw new Error(`Date range ${startDate}..${endDate} is inverted.`);
  return dates;
}

export function scheduleForLeg(contract, leg) {
  const definition = contract?.legs?.[leg];
  if (!definition) throw new Error(`Unknown sea-trial leg: ${leg}`);
  if (!Array.isArray(contract.slots) || contract.slots.length !== definition.ticks_per_date) {
    throw new Error(`${leg} schedule does not match ticks_per_date.`);
  }
  const dates = datesInclusive(definition.start_date, definition.end_date);
  if (dates.length !== definition.dates) throw new Error(`${leg} date count is not ${definition.dates}.`);

  const schedule = dates.flatMap((date, dateIndex) => contract.slots.map((slot, slotIndex) => {
    if (!/^\d{2}:\d{2}$/.test(slot)) throw new Error(`Invalid opportunity slot: ${slot}`);
    const ordinal = slotIndex + 1;
    return {
      leg,
      date,
      date_index: dateIndex + 1,
      slot,
      slot_index: ordinal,
      tick_index: dateIndex * contract.slots.length + ordinal,
      tick_id: `p3-${leg}-${date}-${String(ordinal).padStart(2, '0')}`,
      scheduled_at: `${date}T${slot}:00${PHOENIX_OFFSET}`,
    };
  }));

  if (schedule.length !== definition.required_ticks) {
    throw new Error(`${leg} tick count is not ${definition.required_ticks}.`);
  }
  return schedule;
}

export function resolveScheduledTick(contract, leg, tickId) {
  const tick = scheduleForLeg(contract, leg).find((entry) => entry.tick_id === tickId);
  if (!tick) throw new Error(`${tickId} is not a scheduled ${leg} tick.`);
  return tick;
}

export function validateFixedSchedule(contract) {
  if (contract.timezone !== 'America/Phoenix') throw new Error('Fixed Sea Trials must use America/Phoenix.');
  if (contract.publication_enabled !== false || contract.manual_override_enabled !== false) {
    throw new Error('Phase 3 must expose neither publication nor manual override.');
  }
  const transport = contract.git_transport;
  if (transport?.runtime_branch !== 'dialogue-phase-3-runtime-v2' || transport?.production_branch !== 'main'
    || transport?.runtime_branch_deployments_enabled !== false
    || JSON.stringify(transport?.production_projection_points) !== JSON.stringify([
      'accelerated-final-close',
      'each-realtime-daily-close',
      'final-exit',
    ])) {
    throw new Error('Phase 3 Git transport must freeze the isolated runtime branch and exact production projection points.');
  }
  const accelerated = scheduleForLeg(contract, 'accelerated');
  const realtime = scheduleForLeg(contract, 'realtime');
  if (accelerated.length !== 120 || new Set(accelerated.map((tick) => tick.date)).size !== 30) {
    throw new Error('Accelerated schedule must be exactly 120 ticks across 30 dates.');
  }
  if (realtime.length !== 28 || new Set(realtime.map((tick) => tick.date)).size !== 7) {
    throw new Error('Realtime schedule must be exactly 28 ticks across seven dates.');
  }
  return { accelerated, realtime };
}
