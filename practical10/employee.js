const employeeForm = document.querySelector("#employeeForm");
const employeeRows = document.querySelector("#employeeRows");
const jsonOutput = document.querySelector("#jsonOutput");
const loadButton = document.querySelector("#loadButton");
const statusMessage = document.querySelector("#statusMessage");
const employeeCount = document.querySelector("#employeeCount");
const tableCount = document.querySelector("#tableCount");
const storageKey = "employeeDirectoryRecords";
const removedStorageKey = "employeeDirectoryRemovedIds";
let employees = [];
let removedEmployeeIds = new Set();

try {
  const savedEmployees = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(savedEmployees)) {
    employees = savedEmployees;
  }
} catch {
  employees = [];
}

try {
  const savedRemovedIds = JSON.parse(localStorage.getItem(removedStorageKey) || "[]");
  if (Array.isArray(savedRemovedIds)) {
    removedEmployeeIds = new Set(savedRemovedIds);
  }
} catch {
  removedEmployeeIds = new Set();
}

function saveEmployees() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(employees));
    return true;
  } catch {
    return false;
  }
}

function saveRemovedEmployeeIds() {
  try {
    localStorage.setItem(removedStorageKey, JSON.stringify([...removedEmployeeIds]));
    return true;
  } catch {
    return false;
  }
}

function renderEmployees() {
  employeeRows.replaceChildren();
  employeeCount.textContent = String(employees.length);
  tableCount.textContent = `${employees.length} ${employees.length === 1 ? "record" : "records"}`;

  if (employees.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.className = "empty-row";
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.textContent = "No employee records yet.";
    emptyRow.append(emptyCell);
    employeeRows.append(emptyRow);
    return;
  }

  employees.forEach((employee, index) => {
    const row = document.createElement("tr");
    const idCell = document.createElement("td");
    idCell.className = "employee-id";
    idCell.textContent = employee.employeeId;
    const nameCell = document.createElement("td");
    nameCell.className = "employee-name";
    nameCell.textContent = employee.employeeName;
    const departmentCell = document.createElement("td");
    const departmentTag = document.createElement("span");
    departmentTag.className = "department-tag";
    departmentTag.textContent = employee.department;
    departmentCell.append(departmentTag);
    const salaryCell = document.createElement("td");
    salaryCell.className = "salary";
    salaryCell.textContent = Number(employee.salary).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    });
    const actionCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${employee.employeeName}`);
    removeButton.addEventListener("click", () => {
      const [removedEmployee] = employees.splice(index, 1);
      removedEmployeeIds.add(removedEmployee.employeeId);
      const saved = saveEmployees() && saveRemovedEmployeeIds();
      renderEmployees();
      statusMessage.dataset.kind = saved ? "success" : "error";
      statusMessage.textContent = saved
        ? `${removedEmployee.employeeName} removed from the directory.`
        : `${removedEmployee.employeeName} removed, but the change could not be saved.`;
    });
    actionCell.append(removeButton);
    row.append(idCell, nameCell, departmentCell, salaryCell, actionCell);
    employeeRows.append(row);
  });
}

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(employeeForm);
  const d = {
    employeeId: String(formData.get("employeeId")).trim(),
    employeeName: String(formData.get("employeeName")).trim(),
    department: String(formData.get("department")).trim(),
    salary: Number(formData.get("salary"))
  };
  removedEmployeeIds.delete(d.employeeId);
  saveRemovedEmployeeIds();
  const employeeJson = JSON.stringify(d, null, 2);
  jsonOutput.textContent = employeeJson;
  employees.unshift(d);
  const saved = saveEmployees();
  renderEmployees();
  employeeForm.reset();
  statusMessage.dataset.kind = saved ? "success" : "error";
  statusMessage.textContent = saved
    ? `${d.employeeName} added to the directory.`
    : `${d.employeeName} added, but could not be saved in this browser.`;
});

loadButton.addEventListener("click", async () => {
  loadButton.disabled = true;
  statusMessage.dataset.kind = "";
  statusMessage.textContent = "Loading employee records...";

  try {
    const response = await fetch("employees.json");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const records = await response.json();
    if (!Array.isArray(records)) {
      throw new Error("Employee data must be a JSON array.");
    }
    const availableRecords = records.filter((employee) => !removedEmployeeIds.has(employee.employeeId));
    const loadedIds = new Set(availableRecords.map((employee) => employee.employeeId));
    employees = [...availableRecords, ...employees.filter((employee) => !loadedIds.has(employee.employeeId))];
    saveEmployees();
    renderEmployees();
    statusMessage.dataset.kind = "success";
    statusMessage.textContent = `${employees.length} employee records loaded.`;
  } catch (error) {
    statusMessage.dataset.kind = "error";
    statusMessage.textContent = `Could not load employees.json. Run this page from a local web server. (${error.message})`;
  } finally {
    loadButton.disabled = false;
  }
});

renderEmployees();