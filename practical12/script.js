
$(function () {
  "use strict";

  const API = "https://jsonplaceholder.typicode.com";
  const KEYS = {
    profile: "cc_profile",
    notices: "cc_notices",
    assignments: "cc_assignments"
  };

  const defaultProfile = {
    studentName: "Alex Morgan",
    studentEmail: "alex@example.com",
    studentId: "STU2026001",
    studentCourse: "Computer Science",
    studentYear: "First Year",
    studentPhone: ""
  };

  const defaultNotices = [
    {
      id: "n1",
      title: "Mid-semester examination schedule",
      category: "Exams",
      description: "Check the college notice board for the latest examination timetable and instructions.",
      date: "2026-10-20",
      source: "local"
    },
    {
      id: "n2",
      title: "Campus coding competition",
      category: "Events",
      description: "Participate in coding challenges, work with classmates, and showcase your programming skills.",
      date: "2026-10-19",
      source: "local"
    },
    {
      id: "n3",
      title: "Library hours update",
      category: "General",
      description: "Please check the library desk for updated opening hours during the examination period.",
      date: "2026-10-18",
      source: "local"
    }
  ];

  const events = [
    {
      id: "e1", title: "Annual Tech Fest", category: "Technology",
      date: "2026-11-05", location: "Main Auditorium",
      description: "Explore coding contests, technology exhibitions, student projects, and demonstrations."
    },
    {
      id: "e2", title: "Career Development Workshop", category: "Career",
      date: "2026-11-12", location: "Seminar Hall A",
      description: "Learn about resume writing, interviews, communication, and internship opportunities."
    },
    {
      id: "e3", title: "Intercollege Sports Meet", category: "Sports",
      date: "2026-11-20", location: "College Sports Ground",
      description: "Join fellow students in a celebration of sports, teamwork, and healthy competition."
    },
    {
      id: "e4", title: "Student Innovation Day", category: "Innovation",
      date: "2026-12-02", location: "Innovation Centre",
      description: "Showcase your creative ideas, prototypes, and student-led projects."
    }
  ];

  const defaultAssignments = [
    { id: "a1", title: "Responsive web page", subject: "Web Development", dueDate: "2026-11-02", status: "Pending" },
    { id: "a2", title: "Database normalization report", subject: "DBMS", dueDate: "2026-10-28", status: "Pending" },
    { id: "a3", title: "Data structures exercises", subject: "Computer Science", dueDate: "2026-10-25", status: "Completed" },
    { id: "a4", title: "JavaScript mini project", subject: "Web Development", dueDate: "2026-11-08", status: "Pending" }
  ];

  // Storage helpers
  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.warn("Storage read failed:", error);
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage write failed:", error);
      toast("Could not save data in browser storage.");
      return false;
    }
  }

  let profile = {
    ...defaultProfile,
    ...readStorage(KEYS.profile, {})
  };

  let notices = readStorage(KEYS.notices, defaultNotices);
  let assignments = readStorage(KEYS.assignments, defaultAssignments);

  if (!Array.isArray(notices)) notices = defaultNotices.slice();
  if (!Array.isArray(assignments)) assignments = defaultAssignments.slice();

  // Escape untrusted text before inserting it into HTML.
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function dateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return "Date unavailable";
    const d = new Date(value + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "Date unavailable";
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  function toast(message) {
    const $toast = $("#toast");
    $toast.text(message).addClass("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $toast.removeClass("show"), 3000);
  }

  // Navigation and delegated jQuery events
  function navigate(page) {
    if (!$("#" + page).hasClass("page")) return;

    $(".page").removeClass("active");
    $("#" + page).addClass("active");
    $(".nav-link").removeClass("active");
    $('.nav-link[data-page="' + page + '"]').addClass("active");

    $("#pageTitle").text(
      $('.nav-link[data-page="' + page + '"]').text().trim()
    );
    $("#sidebar").removeClass("open");

    if (location.hash !== "#" + page) {
      history.replaceState(null, "", "#" + page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $(".nav-link").on("click", function (e) {
    e.preventDefault();
    navigate($(this).data("page"));
  });

  $(document).on("click", "[data-go]", function () {
    navigate($(this).data("go"));
  });

  $("#profileShortcut").on("click", () => navigate("profile"));
  $("#menuToggle").on("click", () => $("#sidebar").toggleClass("open"));

  $(document).on("click", function (e) {
    if (window.innerWidth <= 760 &&
        !$(e.target).closest("#sidebar, #menuToggle").length) {
      $("#sidebar").removeClass("open");
    }
  });

  // Dashboard
  function renderDashboard() {
    const pending = assignments.filter(x => x.status === "Pending").length;
    const completed = assignments.filter(x => x.status === "Completed").length;

    $("#noticeCount").text(notices.length);
    $("#eventCount").text(events.filter(x => x.date >= today()).length);
    $("#pendingCount").text(pending);
    $("#completedCount").text(completed);
    $("#welcomeName").text(profile.studentName.trim().split(/\s+/)[0] || "Student");

    const recent = notices.slice().sort(
      (a, b) => String(b.date).localeCompare(String(a.date))
    ).slice(0, 4);

    $("#recentNotices").html(recent.length ? recent.map(n => `
      <article class="list-item">
        <div class="item-icon">▤</div>
        <div class="item-body">
          <h3>${esc(n.title)}</h3>
          <p>${esc(n.description)}</p>
          <div class="item-meta">${esc(n.category)} · ${dateLabel(n.date)}</div>
        </div>
      </article>
    `).join("") : '<div class="empty">No notices yet.</div>');

    const upcoming = events.filter(x => x.date >= today()).slice(0, 3);

    $("#upcomingEvents").html(upcoming.length ? upcoming.map(e => `
      <article class="list-item">
        <div class="item-icon">▣</div>
        <div class="item-body">
          <h3>${esc(e.title)}</h3>
          <p>${esc(e.description)}</p>
          <div class="item-meta">${dateLabel(e.date)} · ${esc(e.location)}</div>
        </div>
      </article>
    `).join("") : '<div class="empty">No upcoming events.</div>');

    $("#dashboardAssignments").html(assignments.slice(0, 4).map(a => `
      <tr>
        <td>${esc(a.title)}</td>
        <td>${esc(a.subject)}</td>
        <td>${dateLabel(a.dueDate)}</td>
        <td><span class="status ${a.status === "Completed" ? "completed" : "pending"}">${esc(a.status)}</span></td>
      </tr>
    `).join(""));
  }

  // Profile form and localStorage
  function renderProfile() {
    $("#studentName").val(profile.studentName);
    $("#studentEmail").val(profile.studentEmail);
    $("#studentId").val(profile.studentId);
    $("#studentCourse").val(profile.studentCourse);
    $("#studentYear").val(profile.studentYear);
    $("#studentPhone").val(profile.studentPhone);

    $("#profileDisplayName").text(profile.studentName);
    $("#profileDisplayCourse").text(profile.studentCourse + " · " + profile.studentYear);

    const initial = profile.studentName.trim().charAt(0) || "S";
    $("#profileAvatar, #profileShortcut").text(initial);
  }

  $("#profileForm").on("submit", function (e) {
    e.preventDefault();

    const updated = {
      studentName: $("#studentName").val().trim(),
      studentEmail: $("#studentEmail").val().trim(),
      studentId: $("#studentId").val().trim(),
      studentCourse: $("#studentCourse").val(),
      studentYear: $("#studentYear").val(),
      studentPhone: $("#studentPhone").val().trim()
    };

    if (!updated.studentName || !updated.studentEmail) {
      toast("Enter your name and email.");
      return;
    }

    if (!saveStorage(KEYS.profile, updated)) return;

    profile = updated;
    renderProfile();
    renderDashboard();
    $("#profileMessage").text("Profile saved successfully.");
    toast("Profile updated.");
  });

  // Notices: search, category filtering, and DOM rendering
  function renderNotices() {
    const query = $("#noticeSearch").val().trim().toLowerCase();
    const category = $("#noticeFilter").val();

    const filtered = notices.filter(n =>
      [n.title, n.description, n.category].join(" ").toLowerCase().includes(query) &&
      (category === "all" || n.category === category)
    );

    $("#noticeList").html(filtered.length ? filtered.map(n => `
      <article class="notice-card">
        <div class="card-top">
          <span class="category">${esc(n.category)}</span>
          <button class="delete-button" data-delete-notice="${esc(n.id)}">Delete</button>
        </div>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.description)}</p>
        <div class="item-meta">${dateLabel(n.date)} · ${n.source === "api" ? "Demo API" : "Campus notice"}</div>
      </article>
    `).join("") : '<div class="empty">No matching notices found.</div>');
  }

  $("#noticeSearch, #noticeFilter").on("input change", renderNotices);

  function openModal() {
    $("#noticeForm")[0].reset();
    $("#noticeModal").addClass("open").attr("aria-hidden", "false");
    $("#noticeTitle").trigger("focus");
  }

  function closeModal() {
    $("#noticeModal").removeClass("open").attr("aria-hidden", "true");
  }

  $("#addNoticeBtn, #quickAdd").on("click", openModal);
  $("#closeModal, #cancelModal").on("click", closeModal);

  $("#noticeModal").on("click", function (e) {
    if (e.target === this) closeModal();
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  $("#noticeForm").on("submit", function (e) {
    e.preventDefault();

    const notice = {
      id: "n-" + Date.now(),
      title: $("#noticeTitle").val().trim(),
      category: $("#noticeCategory").val(),
      description: $("#noticeDescription").val().trim(),
      date: today(),
      source: "local"
    };

    if (!notice.title || !notice.description) {
      toast("Please complete all fields.");
      return;
    }

    notices.unshift(notice);
    saveStorage(KEYS.notices, notices);
    renderNotices();
    renderDashboard();
    closeModal();
    toast("Notice added.");

    // Demonstration POST request.
    // JSONPlaceholder does not persist records in a real database.
    $.ajax({
      url: API + "/posts",
      method: "POST",
      contentType: "application/json; charset=UTF-8",
      dataType: "json",
      timeout: 8000,
      data: JSON.stringify({
        title: notice.title,
        body: notice.description,
        userId: 1
      })
    }).done(function () {
      console.info("Demo API accepted the notice.");
    }).fail(function () {
      console.warn("Demo API unavailable; local notice remains saved.");
    });
  });

  $(document).on("click", "[data-delete-notice]", function () {
    const id = String($(this).attr("data-delete-notice"));

    if (!confirm("Are you sure you want to delete this notice?")) return;

    notices = notices.filter(n => String(n.id) !== id);
    saveStorage(KEYS.notices, notices);
    renderNotices();
    renderDashboard();
    toast("Notice deleted.");
  });

  // Campus events
  function renderEvents() {
    const upcoming = events.filter(e => e.date >= today());

    $("#eventList").html(upcoming.length ? upcoming.map(e => `
      <article class="event-card">
        <span class="category">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.description)}</p>
        <div class="event-date">${dateLabel(e.date)}</div>
        <div class="item-meta">⌖ ${esc(e.location)}</div>
      </article>
    `).join("") : '<div class="empty">No upcoming events.</div>');
  }

  // Assignment search and status controls
  function renderAssignments() {
    const query = $("#assignmentSearch").val().trim().toLowerCase();
    const status = $("#assignmentFilter").val();

    const filtered = assignments.filter(a =>
      (a.title + " " + a.subject).toLowerCase().includes(query) &&
      (status === "all" || a.status === status)
    );

    $("#assignmentList").html(filtered.length ? filtered.map(a => `
      <tr>
        <td>${esc(a.title)}</td>
        <td>${esc(a.subject)}</td>
        <td>${dateLabel(a.dueDate)}</td>
        <td><span class="status ${a.status === "Completed" ? "completed" : "pending"}">${esc(a.status)}</span></td>
        <td><button class="small-action" data-toggle-assignment="${esc(a.id)}">${a.status === "Completed" ? "Reopen" : "Complete"}</button></td>
      </tr>
    `).join("") : '<tr><td colspan="5">No assignments found.</td></tr>');
  }

  $("#assignmentSearch, #assignmentFilter").on("input change", renderAssignments);

  $(document).on("click", "[data-toggle-assignment]", function () {
    const id = String($(this).attr("data-toggle-assignment"));
    const assignment = assignments.find(a => String(a.id) === id);
    if (!assignment) return;

    assignment.status = assignment.status === "Completed" ? "Pending" : "Completed";

    saveStorage(KEYS.assignments, assignments);
    renderAssignments();
    renderDashboard();
    toast("Assignment status updated.");
  });

  // AJAX GET: load sample notices from a test API
  function loadApiNotices() {
    $.ajax({
      url: API + "/posts",
      method: "GET",
      data: { _limit: 3 },
      dataType: "json",
      timeout: 8000
    }).done(function (data) {
      if (!Array.isArray(data)) return;

      const knownIds = new Set(notices.map(n => String(n.id)));

      data.forEach(post => {
        const id = "api-" + post.id;

        if (!knownIds.has(id)) {
          notices.push({
            id: id,
            title: post.title,
            category: "General",
            description: post.body,
            date: today(),
            source: "api"
          });
        }
      });

      saveStorage(KEYS.notices, notices);
      renderNotices();
      renderDashboard();
    }).fail(function () {
      console.warn("API request failed. Showing saved notices.");
    });
  }

  // Initialize the complete portal
  renderProfile();
  renderDashboard();
  renderNotices();
  renderEvents();
  renderAssignments();

  const validPages = ["dashboard", "profile", "notices", "events", "assignments"];
  const initialPage = location.hash.slice(1);

  navigate(validPages.includes(initialPage) ? initialPage : "dashboard");
  loadApiNotices();
});
