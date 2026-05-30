/* ═══════════════════════ STORAGE KEYS ═══════════════════════ */
const KEY_USER  = 'ntm_username';
const KEY_TODOS = 'ntm_todos';

/* ═══════════════════════ STATE ═══════════════════════ */
let username = '';
let allTodos = [];
let filter   = 'all';

try { username = localStorage.getItem(KEY_USER) || ''; } catch { username = ''; }
try { allTodos = JSON.parse(localStorage.getItem(KEY_TODOS)) || []; } catch { allTodos = []; }

/* ═══════════════════════ BOOT ═══════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* ── DOM REFS ── */
  const onboarding    = document.getElementById('onboarding');
  const nameInput     = document.getElementById('name-input');
  const nameSubmit    = document.getElementById('name-submit');
  const displayName   = document.getElementById('display-name');
  const taskCount     = document.getElementById('task-count');
  const todoForm      = document.getElementById('todo-form');
  const todoInput     = document.getElementById('todo-input');
  const todoListUL    = document.getElementById('todo-list');
  const emptyState    = document.getElementById('empty-state');
  const resetBtn      = document.getElementById('reset-btn');
  const confirmModal  = document.getElementById('confirm-modal');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk     = document.getElementById('confirm-ok');
  const filterBtns    = document.querySelectorAll('.filter-btn');

  /* abort silently if any critical element is missing */
  if (!onboarding || !todoForm || !todoInput || !todoListUL ||
      !emptyState  || !taskCount || !displayName) return;

  /* ═══════════════════════ ONBOARDING ═══════════════════════ */
  function capitalizeName(str) {
    return str
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  function submitName() {
    const val = nameInput ? nameInput.value.trim() : '';
    if (!val) return;
    username = capitalizeName(val);
    if (!username) return;
    try { localStorage.setItem(KEY_USER, username); } catch { /* storage unavailable */ }
    onboarding.classList.add('hidden');
    init();
  }

  if (nameSubmit) nameSubmit.addEventListener('click', submitName);

  if (nameInput) {
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submitName(); }
    });
  }

  /* ═══════════════════════ INIT ═══════════════════════ */
  function init() {
    displayName.textContent = username;
    updateTodoList();
    startPlaceholderCycle();
  }

  /* ═══════════════════════ SAVE ═══════════════════════ */
  function saveTodos() {
    try { localStorage.setItem(KEY_TODOS, JSON.stringify(allTodos)); } catch { /* storage unavailable */ }
  }

  /* ═══════════════════════ ADD TODO ═══════════════════════ */
  todoForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const text = todoInput.value.trim();
    if (!text) { todoInput.focus(); return false; }

    allTodos.unshift({
      id: Date.now() + '_' + Math.random().toString(36).slice(2),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });

    saveTodos();

    filter = 'all';
    filterBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.filter === 'all');
    });

    updateTodoList();

    todoInput.value = '';
    todoInput.focus();

    return false;
  });

  /* ═══════════════════════ DELETE TODO ═══════════════════════ */
  function deleteTodo(id) {
    allTodos = allTodos.filter(function (t) { return t.id !== id; });
    saveTodos();
    updateTodoList();
  }

  /* ═══════════════════════ TOGGLE TODO ═══════════════════════ */
  function toggleTodo(id) {
    const todo = allTodos.find(function (t) { return t.id === id; });
    if (todo) todo.completed = !todo.completed;
    saveTodos();
    updateTodoList();
  }

  /* ═══════════════════════ EDIT TODO ═══════════════════════ */
  function editTodo(id, li) {
    var todo = allTodos.find(function (t) { return t.id === id; });
    if (!todo) return;

    if (li.classList.contains('editing')) return;
    li.classList.add('editing');

    var textLabel = li.querySelector('.todo-text');
    var editBtn   = li.querySelector('.edit-button');

    var input = document.createElement('input');
    input.type      = 'text';
    input.className = 'todo-edit-input';
    input.value     = todo.text;
    textLabel.replaceWith(input);
    input.focus();
    input.select();

    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px">' +
        '<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>' +
      '</svg>';
    editBtn.setAttribute('aria-label', 'Save task');
    editBtn.style.opacity = '1';

    function save() {
      var newText = input.value.trim();
      if (newText && newText !== todo.text) {
        todo.text = newText;
        saveTodos();
      }
      updateTodoList();
    }

    editBtn.onclick = function (e) { e.stopPropagation(); save(); };

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  { e.preventDefault(); save(); }
      if (e.key === 'Escape') { updateTodoList(); }
    });

    input.addEventListener('blur', function () {
      setTimeout(function () {
        if (li.classList.contains('editing')) save();
      }, 150);
    });
  }

  /* ═══════════════════════ FILTER ═══════════════════════ */
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filter = btn.dataset.filter;
      filterBtns.forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      updateTodoList();
    });
  });

  function getFiltered() {
    if (filter === 'active') return allTodos.filter(function (t) { return !t.completed; });
    if (filter === 'done')   return allTodos.filter(function (t) { return  t.completed; });
    return allTodos;
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */
  function updateTodoList() {
    const visible = getFiltered();

    todoListUL.innerHTML = '';

    const total = allTodos.length;
    const done  = allTodos.filter(function (t) { return t.completed; }).length;

    taskCount.textContent = total === 0 ? 'No tasks' : (done + '/' + total + ' done');

    emptyState.classList.toggle('visible', visible.length === 0);

    const emP = emptyState.querySelector('p');
    if (emP) {
      if (filter === 'done' && allTodos.length > 0) {
        emP.innerHTML = 'Nothing completed yet.<br>Check off a task above!';
      } else if (filter === 'active' && done === total && total > 0) {
        emP.innerHTML = "You're all caught up! 🎉<br>Everything is done.";
      } else {
        emP.innerHTML = 'Nothing here yet.<br>Add a task above to get started.';
      }
    }

    visible.forEach(function (todo) {
      todoListUL.appendChild(createTodoItem(todo));
    });
  }

  function createTodoItem(todo) {
    const cbId = 'todo-cb-' + todo.id;

    const li = document.createElement('li');
    li.className = 'todo';

    const timeBadge = todo.createdAt
      ? '<span class="time-badge">' + formatDate(todo.createdAt) + '</span>'
      : '';

    li.innerHTML =
      '<input type="checkbox" id="' + cbId + '"' + (todo.completed ? ' checked' : '') + '>' +
      '<label for="' + cbId + '" class="custom-checkbox">' +
        '<svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#e3e3e3">' +
          '<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>' +
        '</svg>' +
      '</label>' +
      '<label for="' + cbId + '" class="todo-text">' + escapeHtml(todo.text) + '</label>' +
      timeBadge +
      '<button class="edit-button" aria-label="Edit task">' +
        '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px">' +
          '<path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>' +
        '</svg>' +
      '</button>' +
      '<button class="delete-button" aria-label="Delete task">' +
        '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px">' +
          '<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>' +
        '</svg>' +
      '</button>';

    li.querySelector('input[type="checkbox"]')
      .addEventListener('change', function () { toggleTodo(todo.id); });

    li.querySelector('.edit-button')
      .addEventListener('click', function () { editTodo(todo.id, li); });

    li.querySelector('.delete-button')
      .addEventListener('click', function () { deleteTodo(todo.id); });

    return li;
  }

  /* ═══════════════════════ HELPERS ═══════════════════════ */
  function escapeHtml(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  function formatDate(iso) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d      = new Date(iso);
    const day    = String(d.getDate()).padStart(2, '0');
    const month  = months[d.getMonth()];
    const year   = d.getFullYear();
    const hours  = String(d.getHours()).padStart(2, '0');
    const mins   = String(d.getMinutes()).padStart(2, '0');
    return day + ' ' + month + ' ' + year + ' · ' + hours + ':' + mins;
  }

  /* ═══════════════════════ RESET ═══════════════════════ */
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (confirmModal) confirmModal.classList.remove('hidden');
    });
  }

  if (confirmCancel) {
    confirmCancel.addEventListener('click', function () {
      confirmModal.classList.add('hidden');
    });
  }

  if (confirmOk) {
    confirmOk.addEventListener('click', function () {
      try { localStorage.removeItem(KEY_USER); localStorage.removeItem(KEY_TODOS); } catch { /* ignore */ }
      location.reload();
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', function (e) {
      if (e.target === confirmModal) confirmModal.classList.add('hidden');
    });
  }

  /* ═══════════════════════ PLACEHOLDER CYCLE ═══════════════════════ */
  const placeholders = [
    'What needs to happen?',
    'Drop it here and forget about it',
    'Something on your mind?',
    'What haunts you today?',
    'Type it. Own it.',
    'Note to self...',
    'One thing at a time...',
    'What are you putting off?',
    'Start somewhere...',
    "Today's mission...",
    'Capture it before it slips away...',
    "What's the next move?",
    'Make it count...',
    'Before you forget...'
];

  let phIdx = 0;

  function startPlaceholderCycle() {
    todoInput.placeholder = placeholders[0];
    todoInput.style.transition = 'opacity 400ms ease';

   setInterval(function () {
  todoInput.style.opacity = '0';
  setTimeout(function () {
    phIdx = (phIdx + 1) % placeholders.length;
    todoInput.placeholder = placeholders[phIdx];
    todoInput.style.opacity = '1';
  }, 350);
}, 6000);          
  }

  /* ═══════════════════════ START ═══════════════════════ */
  if (username) {
    onboarding.classList.add('hidden');
    init();
  } else {
    setTimeout(function () { if (nameInput) nameInput.focus(); }, 100);
  }

}); /* end DOMContentLoaded */