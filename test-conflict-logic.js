// Script de teste para verificar lógica de conflito de horários

const existingReservation = {
  startTime: "2025-09-18T00:00:00.000Z", // Meia-noite
  endTime: "2025-09-18T01:00:00.000Z", // 1h da manhã
};

const testCases = [
  {
    name: "Mesmo horário (deveria dar conflito)",
    startTime: "2025-09-18T00:00:00.000Z",
    endTime: "2025-09-18T01:00:00.000Z",
  },
  {
    name: "Horário sobreposto - início (deveria dar conflito)",
    startTime: "2025-09-17T23:30:00.000Z", // 23:30 do dia anterior
    endTime: "2025-09-18T00:30:00.000Z", // 00:30
  },
  {
    name: "Horário sobreposto - fim (deveria dar conflito)",
    startTime: "2025-09-18T00:30:00.000Z", // 00:30
    endTime: "2025-09-18T01:30:00.000Z", // 01:30
  },
  {
    name: "Horário dentro (deveria dar conflito)",
    startTime: "2025-09-18T00:15:00.000Z", // 00:15
    endTime: "2025-09-18T00:45:00.000Z", // 00:45
  },
  {
    name: "Horário que engloba (deveria dar conflito)",
    startTime: "2025-09-17T23:00:00.000Z", // 23:00 do dia anterior
    endTime: "2025-09-18T02:00:00.000Z", // 02:00
  },
  {
    name: "Horário antes - SEM conflito",
    startTime: "2025-09-17T22:00:00.000Z", // 22:00 do dia anterior
    endTime: "2025-09-17T23:00:00.000Z", // 23:00 do dia anterior
  },
  {
    name: "Horário depois - SEM conflito",
    startTime: "2025-09-18T02:00:00.000Z", // 02:00
    endTime: "2025-09-18T03:00:00.000Z", // 03:00
  },
  {
    name: "Horário no mesmo dia mas diferente - SEM conflito",
    startTime: "2025-09-18T10:00:00.000Z", // 10:00
    endTime: "2025-09-18T11:00:00.000Z", // 11:00
  },
];

function checkConflict(existingStart, existingEnd, newStart, newEnd) {
  const existing_start = new Date(existingStart);
  const existing_end = new Date(existingEnd);
  const new_start = new Date(newStart);
  const new_end = new Date(newEnd);

  return (
    (new_start >= existing_start && new_start < existing_end) ||
    (new_end > existing_start && new_end <= existing_end) ||
    (new_start <= existing_start && new_end >= existing_end)
  );
}

console.log("=== TESTE DE LÓGICA DE CONFLITO DE HORÁRIOS ===\n");
console.log("Reserva existente:", existingReservation);
console.log("=====================================\n");

testCases.forEach((testCase) => {
  const hasConflict = checkConflict(
    existingReservation.startTime,
    existingReservation.endTime,
    testCase.startTime,
    testCase.endTime
  );

  console.log(`${testCase.name}:`);
  console.log(`  Novo horário: ${testCase.startTime} - ${testCase.endTime}`);
  console.log(`  Conflito: ${hasConflict ? "❌ SIM" : "✅ NÃO"}`);
  console.log("");
});
