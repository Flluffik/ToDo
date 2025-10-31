class TodoManager {
    constructor() {
        this.tasks = this.loadTasks();
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('todo-tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Ошибка загрузки задач:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('todo-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Ошибка сохранения задач:', error);
        }
    }

    addTask(text, date) {
        const task = {
            id: Date.now().toString(),
            text: text.trim(),
            date: date || new Date().toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            order: this.tasks.length
        };

        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    deleteTask(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        
        if (this.tasks.length !== initialLength) {
            this.saveTasks();
            return true;
        }
        return false;
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            return true;
        }
        return false;
    }

    updateTask(id, newText, newDate) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.text = newText.trim();
            task.date = newDate;
            this.saveTasks();
            return true;
        }
        return false;
    }

    getAllTasks() {
        return [...this.tasks];
    }

    getTasksByStatus(completed) {
        return this.tasks.filter(task => task.completed === completed);
    }

    searchTasks(query) {
        if (!query || query.trim() === '') {
            return []; 
        }
        
        const searchTerm = query.toLowerCase().trim();
        return this.tasks.filter(task => 
            task.text.toLowerCase().includes(searchTerm) ||
            this.doesDateMatch(task.date, searchTerm)
        );
    }

    doesDateMatch(taskDate, searchTerm) {
        try {
            const taskDateObj = new Date(taskDate);
            if (isNaN(taskDateObj.getTime())) return false;

            const day = taskDateObj.getDate().toString();
            const month = (taskDateObj.getMonth() + 1).toString();
            const year = taskDateObj.getFullYear().toString();
            
            const monthNames = {
                '1': 'январь', '01': 'январь',
                '2': 'февраль', '02': 'февраль',
                '3': 'март', '03': 'март',
                '4': 'апрель', '04': 'апрель',
                '5': 'май', '05': 'май',
                '6': 'июнь', '06': 'июнь',
                '7': 'июль', '07': 'июль',
                '8': 'август', '08': 'август',
                '9': 'сентябрь', '09': 'сентябрь',
                '10': 'октябрь',
                '11': 'ноябрь',
                '12': 'декабрь'
            };

            const monthShortNames = {
                'янв': 'январь',
                'фев': 'февраль',
                'мар': 'март',
                'апр': 'апрель',
                'май': 'май',
                'июн': 'июнь',
                'июл': 'июль',
                'авг': 'август',
                'сен': 'сентябрь',
                'окт': 'октябрь',
                'ноя': 'ноябрь',
                'дек': 'декабрь'
            };

            const taskMonthName = monthNames[month];
            
            const exactMatches = [
                taskDate, 
                `${day}.${month}.${year}`,
                `${day}.${month.padStart(2, '0')}.${year}`,
                
                year,
                
                month,
                month.padStart(2, '0'),
                taskMonthName,
                
                day,
                day.padStart(2, '0'),
                
                `${year}-${month.padStart(2, '0')}`, 
                `${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 
                `${day.padStart(2, '0')}.${month.padStart(2, '0')}`, 
            ];

            const hasExactMatch = exactMatches.some(format => {
                if (!format) return false;
                return format.toLowerCase() === searchTerm;
            });

            if (hasExactMatch) {
                return true;
            }

            const monthPartialMatches = [
                taskMonthName,
                ...Object.values(monthShortNames)
            ];

            const hasMonthPartialMatch = monthPartialMatches.some(monthName => {
                if (!monthName) return false;
                return monthName.includes(searchTerm) || searchTerm.includes(monthName);
            });

            if (hasMonthPartialMatch) {
                return true;
            }

            const shortMonthMatch = Object.entries(monthShortNames).some(([short, full]) => {
                return short === searchTerm && full === taskMonthName;
            });

            return shortMonthMatch;

        } catch (error) {
            console.error('Ошибка при поиске по дате:', error);
            return false;
        }
    }

    getFilteredTasks(filter, searchQuery = '') {
        let filteredTasks = this.getAllTasks();
        
        if (searchQuery && searchQuery.trim() !== '') {
            filteredTasks = this.searchTasks(searchQuery);
        }
        
        if (filter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        return filteredTasks;
    }

    sortTasksByDate(tasks, order = 'asc') {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }

    moveTask(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return false;
        
        const task = this.tasks.splice(fromIndex, 1)[0];
        this.tasks.splice(toIndex, 0, task);
        this.saveTasks();
        return true;
    }

    getTaskIndex(id) {
        return this.tasks.findIndex(task => task.id === id);
    }

    reorderTasks(orderedIds) {
        const newOrder = [];
        const taskMap = new Map(this.tasks.map(task => [task.id, task]));
        
        orderedIds.forEach(id => {
            const task = taskMap.get(id);
            if (task) newOrder.push(task);
        });
        
        this.tasks.forEach(task => {
            if (!newOrder.find(t => t.id === task.id)) {
                newOrder.push(task);
            }
        });
        
        this.tasks = newOrder;
        this.saveTasks();
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }
}
