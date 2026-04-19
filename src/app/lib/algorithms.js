function allocateSeating(students, rooms, exam) {
  const eligibleStudents = students.filter(
    (s) => exam.branches.includes(s.branch) && s.semester === exam.semester
  ).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
  const availableRooms = rooms.filter((r) => r.isAvailable).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  const totalCapacity = availableRooms.reduce((sum, r) => sum + r.capacity, 0);
  if (eligibleStudents.length === 0) {
    return { allocations: [], error: "No eligible students found for this exam." };
  }
  if (totalCapacity < eligibleStudents.length) {
    return {
      allocations: [],
      error: `Insufficient capacity. Need ${eligibleStudents.length} seats but only ${totalCapacity} available.`
    };
  }
  const allocations = [];
  let studentIndex = 0;
  let allocationId = 1;
  for (const room of availableRooms) {
    if (studentIndex >= eligibleStudents.length) break;
    let seatNumber = 1;
    while (seatNumber <= room.capacity && studentIndex < eligibleStudents.length) {
      allocations.push({
        id: `sa-${exam.id}-${allocationId}`,
        examId: exam.id,
        roomId: room.id,
        studentId: eligibleStudents[studentIndex].id,
        seatNumber
      });
      seatNumber++;
      studentIndex++;
      allocationId++;
    }
  }
  return { allocations };
}
function allocateInvigilators(faculty, rooms, exam, existingAllocations) {
  const availableFaculty = faculty.filter((f) => f.isAvailable).sort((a, b) => a.totalDuties - b.totalDuties);
  const roomsNeeded = rooms.filter((r) => r.isAvailable).slice(0, Math.ceil(rooms.filter((r) => r.isAvailable).length * 0.7));
  if (availableFaculty.length < roomsNeeded.length) {
    return {
      allocations: [],
      error: `Not enough faculty available. Need ${roomsNeeded.length} invigilators but only ${availableFaculty.length} available.`
    };
  }
  const alreadyAssigned = new Set(
    existingAllocations.filter((a) => a.examId === exam.id).map((a) => a.facultyId)
  );
  const allocations = [];
  let facultyIndex = 0;
  let allocationId = 1;
  for (const room of roomsNeeded) {
    if (facultyIndex >= availableFaculty.length) break;
    while (facultyIndex < availableFaculty.length && alreadyAssigned.has(availableFaculty[facultyIndex].id)) {
      facultyIndex++;
    }
    if (facultyIndex >= availableFaculty.length) break;
    allocations.push({
      id: `ia-${exam.id}-${allocationId}`,
      examId: exam.id,
      roomId: room.id,
      facultyId: availableFaculty[facultyIndex].id,
      role: allocationId % 3 === 1 ? "chief" : "assistant"
    });
    alreadyAssigned.add(availableFaculty[facultyIndex].id);
    facultyIndex++;
    allocationId++;
  }
  return { allocations };
}
function generateAttendanceSheet(seatingAllocations, examId, roomId) {
  return seatingAllocations.filter((sa) => sa.examId === examId && sa.roomId === roomId).sort((a, b) => a.seatNumber - b.seatNumber).map((sa) => ({
    id: `att-${sa.id}`,
    examId,
    roomId,
    studentId: sa.studentId,
    status: "not-marked",
    signature: false
  }));
}
export {
  allocateInvigilators,
  allocateSeating,
  generateAttendanceSheet
};
