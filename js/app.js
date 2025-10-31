class TodoApp {
    constructor() {
        this.todoManager = new TodoManager();
        this.currentFilter = 'all';
        this.currentSort = 'asc';
        this.searchQuery = '';
        this.draggedItem = null;
        
        this.init();
    }

    init() {
        this.createDOMStructure();
        this.renderTasks();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    createDOMStructure() {
        const container = this.createElement('div', { className: 'container' });
        
        const header = this.createHeader();
        const todoForm = this.createTodoForm();
        const controls = this.createControls();
        const todoList = this.createElement('ul', { className: 'todo-list' });
        
        container.append(header, todoForm, controls, todoList);
        document.body.appendChild(container);
        
        this.todoList = todoList;
        this.taskInput = document.getElementById('taskInput');
        this.dateInput = document.getElementById('dateInput');
        this.searchInput = document.getElementById('searchInput');
        this.filterSelect = document.getElementById('filterSelect');
        this.sortSelect = document.getElementById('sortSelect');
    }

    createHeader() {
        const header = this.createElement('header', { className: 'header' });
        header.innerHTML = `
            <h1>📝 To-Do List</h1>
            <p>Организуйте свои задачи эффективно</p>
        `;
        return header;
    }

    createTodoForm() {
        const form = this.createElement('form', { className: 'todo-form' });
        form.innerHTML = `
            <div class="form-group">
                <input 
                    type="text" 
                    id="taskInput" 
                    class="form-input" 
                    placeholder="Введите новую задачу..."
                    required
                >
                <input 
                    type="date" 
                    id="dateInput" 
                    class="form-input"
                    value="${new Date().toISOString().split('T')[0]}"
                >
                <button type="submit" class="btn btn-primary">Добавить задачу</button>
            </div>
        `;
        return form;
    }

    createControls() {
        const controls = this.createElement('div', { className: 'controls' });
        controls.innerHTML = `
            <div class="control-group">
                <label class="control-label">Фильтр:</label>
                <select id="filterSelect" class="select">
                    <option value="all">Все задачи</option>
                    <option value="active">Активные</option>
                    <option value="completed">Выполненные</option>
                </select>
            </div>
            <div class="control-group">
                <label class="control-label">Сортировка:</label>
                <select id="sortSelect" class="select">
                    <option value="asc">По дате (сначала старые)</option>
                    <option value="desc">По дате (сначала новые)</option>
                </select>
            </div>
            <div class="control-group">
                <input 
                    type="text" 
                    id="searchInput" 
                    class="search-input" 
                    placeholder="Поиск по названию или дате..."
                    title="Точный поиск по дате: '2024', '25', 'ноябрь', '25.12.2024', '2024-12-25'"
                >
            </div>
        `;
        return controls;
    }

    createTaskElement(task) {
        const li = this.createElement('li', { 
            className: `todo-item ${task.completed ? 'completed' : ''}`,
            draggable: true,
            'data-id': task.id
        });

        li.innerHTML = `
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${task.completed ? 'checked' : ''}
            >
            <div class="todo-content">
                <span class="todo-text">${this.escapeHtml(task.text)}</span>
                <span class="todo-date">📅 ${this.formatDate(task.date)}</span>
            </div>
            <div class="todo-actions">
                <button type="button" class="btn-icon btn-edit" title="Редактировать" data-id="${task.id}">✏️</button>
                <button type="button" class="btn-icon btn-delete" title="Удалить" data-id="${task.id}">🗑️</button>
            </div>
        `;

        return li;
    }

    renderTasks() {
        this.todoList.innerHTML = '';
        
        let tasks = this.todoManager.getFilteredTasks(this.currentFilter, this.searchQuery);
        
        tasks = this.todoManager.sortTasksByDate(tasks, this.currentSort);
        
        if (tasks.length === 0) {
            this.renderEmptyState();
        } else {
            tasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.todoList.appendChild(taskElement);
            });
        }
    }

    renderEmptyState() {
        const emptyState = this.createElement('div', { className: 'empty-state' });
        
        let message = '';
        let hint = '';
        
        if (this.searchQuery && this.searchQuery.trim() !== '') {
            message = `Задачи по запросу "${this.searchQuery}" не найдены`;
            hint = 'Попробуйте изменить поисковый запрос';
        } else if (this.currentFilter === 'active') {
            message = 'Нет активных задач';
            hint = 'Все задачи выполнены или пока не добавлены';
        } else if (this.currentFilter === 'completed') {
            message = 'Нет выполненных задач';
            hint = 'Задачи еще не выполнены или пока не добавлены';
        } else {
            message = 'Пока нет задач. Добавьте первую задачу!';
            hint = 'Используйте форму выше для создания новой задачи';
        }
        
        const searchHint = this.searchQuery ? `
            <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; text-align: left;">
                <h4 style="margin-bottom: 0.5rem;">💡 Подсказки по поиску:</h4>
                <div style="font-size: 0.9rem;">
                    <div><strong>По тексту:</strong> любая часть названия задачи</div>
                    <div><strong>По году:</strong> "2024"</div>
                    <div><strong>По месяцу:</strong> "ноябрь", "11", "ноя"</div>
                    <div><strong>По дню:</strong> "25", "31" </div>
                </div>
            </div>
        ` : '';
        
        emptyState.innerHTML = `
            <h3>${message}</h3>
            <p>${hint}</p>
            ${searchHint}
        `;
        
        this.todoList.appendChild(emptyState);
    }

    setupEventListeners() {
        const form = document.querySelector('.todo-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTask();
            });
        }

        if (this.filterSelect) {
            this.filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderTasks();
            });
        }

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderTasks();
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderTasks();
            });
        }

        this.todoList.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('todo-checkbox')) {
                const taskItem = target.closest('.todo-item');
                if (taskItem) {
                    const taskId = taskItem.dataset.id;
                    this.handleToggleTask(taskId);
                }
            }
            
            if (target.classList.contains('btn-delete')) {
                const taskId = target.dataset.id;
                if (taskId) {
                    this.handleDeleteTask(taskId);
                }
            }
            
            if (target.classList.contains('btn-edit')) {
                const taskId = target.dataset.id;
                if (taskId) {
                    this.handleEditTask(taskId);
                }
            }
        });

        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        this.todoList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                this.draggedItem = e.target;
                setTimeout(() => {
                    e.target.classList.add('dragging');
                }, 0);
            }
        });

        this.todoList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('dragging');
                this.updateTaskOrder();
                this.draggedItem = null;
            }
        });

        this.todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!this.draggedItem) return;
            
            const afterElement = this.getDragAfterElement(this.todoList, e.clientY);
            const draggable = this.draggedItem;
            
            if (afterElement == null) {
                this.todoList.appendChild(draggable);
            } else {
                this.todoList.insertBefore(draggable, afterElement);
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleAddTask();
            }
            
            if (e.key === 'Escape' && this.searchInput === document.activeElement) {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.renderTasks();
            }
        });
    }

    handleAddTask() {
        const text = this.taskInput.value.trim();
        const date = this.dateInput.value;

        if (!text) {
            alert('Пожалуйста, введите текст задачи');
            return;
        }

        this.todoManager.addTask(text, date);
        this.taskInput.value = '';
        this.dateInput.value = new Date().toISOString().split('T')[0];
        this.renderTasks();
        
        this.taskInput.focus();
    }

    handleToggleTask(id) {
        const success = this.todoManager.toggleTask(id);
        if (success) {
            this.renderTasks();
        }
    }

    handleDeleteTask(id) {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            const taskElement = this.todoList.querySelector(`[data-id="${id}"]`);
            if (taskElement) {
                taskElement.classList.add('removing');
                setTimeout(() => {
                    const success = this.todoManager.deleteTask(id);
                    if (success) {
                        this.renderTasks();
                    }
                }, 300);
            }
        }
    }

    handleEditTask(id) {
        const task = this.todoManager.getTaskById(id);
        if (!task) {
            console.error('Задача не найдена:', id);
            return;
        }

        const newText = prompt('Редактировать задачу:', task.text);
        if (newText === null) return; 

        if (!newText.trim()) {
            alert('Текст задачи не может быть пустым');
            return;
        }

        let newDate = prompt('Изменить дату (ГГГГ-ММ-ДД):', task.date);
        if (newDate === null) return; 

        // Валидация даты
        if (newDate && newDate.trim() !== '') {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(newDate)) {
                alert('Неверный формат даты. Используйте ГГГГ-ММ-ДД');
                return;
            }
            
            const inputDate = new Date(newDate);
            if (isNaN(inputDate.getTime())) {
                alert('Неверная дата');
                return;
            }
        } else {
            newDate = task.date;
        }

        const success = this.todoManager.updateTask(id, newText.trim(), newDate);
        if (success) {
            this.renderTasks();
        } else {
            alert('Ошибка при обновлении задачи');
        }
    }

    updateTaskOrder() {
        const taskElements = Array.from(this.todoList.querySelectorAll('.todo-item'));
        const orderedIds = taskElements.map(el => el.dataset.id).filter(id => id);
        this.todoManager.reorderTasks(orderedIds);
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        return element;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TodoApp();
    });
} else {
    new TodoApp();
}
