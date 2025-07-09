// 数据管理
class TextManager {
    constructor() {
        this.texts = JSON.parse(localStorage.getItem('texts')) || [];
    }
    
    save() {
        localStorage.setItem('texts', JSON.stringify(this.texts));
    }
    
    getAll() {
        return this.texts;
    }
    
    getById(id) {
        return this.texts.find(text => text.id === id);
    }
    
    add(text) {
        const newText = {
            id: Date.now().toString(),
            title: text.title,
            content: text.content
        };
        this.texts.push(newText);
        this.save();
        return newText;
    }
    
    update(id, updatedText) {
        const index = this.texts.findIndex(text => text.id === id);
        if (index !== -1) {
            this.texts[index] = { ...this.texts[index], ...updatedText };
            this.save();
            return true;
        }
        return false;
    }
    
    delete(id) {
        const index = this.texts.findIndex(text => text.id === id);
        if (index !== -1) {
            this.texts.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }
    
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.texts.filter(text => 
            text.title.toLowerCase().includes(lowerQuery) || 
            text.content.toLowerCase().includes(lowerQuery)
        );
    }
}

// DOM 元素
const elements = {
    textListView: document.getElementById('text-list-view'),
    editTextView: document.getElementById('edit-text-view'),
    reciteView: document.getElementById('recite-view'),
    textsContainer: document.getElementById('texts-container'),
    searchInput: document.getElementById('search-input'),
    addTextBtn: document.getElementById('add-text-btn'),
    toggleViewBtn: document.getElementById('toggle-view'),
    backToListBtn: document.getElementById('back-to-list'),
    backFromReciteBtn: document.getElementById('back-from-recite'),
    cancelEditBtn: document.getElementById('cancel-edit'),
    textForm: document.getElementById('text-form'),
    textId: document.getElementById('text-id'),
    titleInput: document.getElementById('title'),
    contentInput: document.getElementById('content'),
    editTitle: document.getElementById('edit-title'),
    showOriginalBtn: document.getElementById('show-original-btn'),
    originalContainer: document.getElementById('original-container'),
    originalContent: document.getElementById('original-content'),
    recitedInput: document.getElementById('recited'),
    submitReciteBtn: document.getElementById('submit-recite'),
    resetReciteBtn: document.getElementById('reset-recite'),
    resultContainer: document.getElementById('result-container'),
    originalResult: document.getElementById('original-result'),
    recitedResult: document.getElementById('recited-result'),
    timer: document.getElementById('timer'),
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    cancelDeleteBtn: document.getElementById('cancel-delete')
};

// 应用状态
const state = {
    currentTextId: null,
    timerInterval: null,
    startTime: null,
    currentView: 'list',
    deleteCandidateId: null
};

// 文本管理器
const textManager = new TextManager();

// 初始化应用
function initApp() {
    renderTextList();
    setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
    // 导航按钮
    elements.addTextBtn.addEventListener('click', () => showEditView());
    elements.backToListBtn.addEventListener('click', () => showListView());
    elements.backFromReciteBtn.addEventListener('click', () => showListView());
    elements.cancelEditBtn.addEventListener('click', () => showListView());
    
    // 搜索功能
    elements.searchInput.addEventListener('input', () => renderTextList());
    
    // 课文表单
    elements.textForm.addEventListener('submit', handleTextSubmit);
    
    // 默写功能
    elements.showOriginalBtn.addEventListener('click', toggleOriginal);
    elements.submitReciteBtn.addEventListener('click', handleReciteSubmit);
    elements.resetReciteBtn.addEventListener('click', resetRecite);
    
    // 删除模态框
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    
    // 视图切换
    elements.toggleViewBtn.addEventListener('click', toggleViewMode);
}

// 渲染课文列表
function renderTextList() {
    elements.textsContainer.innerHTML = '';
    
    const query = elements.searchInput.value.trim();
    const texts = query ? textManager.search(query) : textManager.getAll();
    
    if (texts.length === 0) {
        elements.textsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>没有找到课文</h3>
                <p>${query ? '没有匹配的课文，请尝试其他搜索词' : '还没有添加课文，点击"添加新课文"按钮开始添加'}</p>
            </div>
        `;
        return;
    }
    
    texts.forEach(text => {
        const card = document.createElement('div');
        card.className = 'text-card';
        card.innerHTML = `
            <div class="text-header">
                <h3>${text.title}</h3>
            </div>
            <div class="text-content">
                ${truncateText(text.content, 200)}
            </div>
            <div class="text-actions">
                <button class="btn secondary edit-btn" data-id="${text.id}">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn primary recite-btn" data-id="${text.id}">
                    <i class="fas fa-pencil-alt"></i> 默写
                </button>
                <button class="btn danger delete-btn" data-id="${text.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        elements.textsContainer.appendChild(card);
    });
    
    // 添加课文操作事件监听器
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditView(btn.dataset.id));
    });
    
    document.querySelectorAll('.recite-btn').forEach(btn => {
        btn.addEventListener('click', () => showReciteView(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
}

// 显示列表视图
function showListView() {
    state.currentView = 'list';
    elements.textListView.classList.add('active');
    elements.editTextView.classList.remove('active');
    elements.reciteView.classList.remove('active');
    renderTextList();
}

// 显示编辑视图
function showEditView(textId = null) {
    state.currentView = 'edit';
    elements.textListView.classList.remove('active');
    elements.editTextView.classList.add('active');
    elements.reciteView.classList.remove('active');
    
    if (textId) {
        const text = textManager.getById(textId);
        if (text) {
            state.currentTextId = textId;
            elements.textId.value = textId;
            elements.titleInput.value = text.title;
            elements.contentInput.value = text.content;
            elements.editTitle.textContent = '编辑课文';
            return;
        }
    }
    
    // 添加新课文
    state.currentTextId = null;
    elements.textId.value = '';
    elements.titleInput.value = '';
    elements.contentInput.value = '';
    elements.editTitle.textContent = '添加新课文';
}

// 显示默写视图
function showReciteView(textId) {
    const text = textManager.getById(textId);
    if (!text) return;
    
    state.currentView = 'recite';
    state.currentTextId = textId;
    elements.textListView.classList.remove('active');
    elements.editTextView.classList.remove('active');
    elements.reciteView.classList.add('active');
    
    // 设置标题
    elements.reciteTitle.textContent = `默写: ${text.title}`;
    
    // 设置原文内容
    elements.originalContent.textContent = text.content;
    
    // 重置默写区域
    elements.recitedInput.value = '';
    elements.resultContainer.style.display = 'none';
    elements.originalContainer.style.display = 'none';
    elements.showOriginalBtn.innerHTML = '<i class="fas fa-eye"></i> 显示原文';
    
    // 启动计时器
    startTimer();
}

// 处理课文表单提交
function handleTextSubmit(e) {
    e.preventDefault();
    
    const textData = {
        title: elements.titleInput.value.trim(),
        content: elements.contentInput.value.trim()
    };
    
    if (!textData.title || !textData.content) {
        alert('标题和内容不能为空');
        return;
    }
    
    if (state.currentTextId) {
        // 更新现有课文
        textManager.update(state.currentTextId, textData);
    } else {
        // 添加新课文
        textManager.add(textData);
    }
    
    showListView();
}

// 处理默写提交
function handleReciteSubmit() {
    const text = textManager.getById(state.currentTextId);
    if (!text) return;
    
    const recited = elements.recitedInput.value.trim();
    if (!recited) {
        alert('请先输入默写内容');
        return;
    }
    
    // 停止计时器
    stopTimer();
    
    // 比较文本差异
    const highlightedOriginal = highlightDifferences(text.content, recited, 'original');
    const highlightedRecited = highlightDifferences(text.content, recited, 'recited');
    
    // 显示结果
    elements.originalResult.innerHTML = highlightedOriginal;
    elements.recitedResult.innerHTML = highlightedRecited;
    elements.resultContainer.style.display = 'block';
    
    // 滚动到结果区域
    elements.resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// 高亮文本差异
function highlightDifferences(original, recited, type) {
    const originalChars = original.split('');
    const recitedChars = recited.split('');
    
    // 生成差异矩阵
    const matcher = new DiffMatchPatch();
    const diffs = matcher.diff_main(original, recited);
    matcher.diff_cleanupSemantic(diffs);
    
    let originalOutput = '';
    let recitedOutput = '';
    let originalIndex = 0;
    let recitedIndex = 0;
    
    for (const [operation, text] of diffs) {
        const chars = text.split('');
        
        switch (operation) {
            case DiffMatchPatch.DIFF_EQUAL:
                // 相同部分
                originalOutput += text;
                recitedOutput += text;
                originalIndex += text.length;
                recitedIndex += text.length;
                break;
                
            case DiffMatchPatch.DIFF_DELETE:
                // 原文中删除的部分（默写中缺失）
                originalOutput += `<span class="missing">${text}</span>`;
                originalIndex += text.length;
                break;
                
            case DiffMatchPatch.DIFF_INSERT:
                // 默写中插入的部分（原文中多余）
                recitedOutput += `<span class="extra">${text}</span>`;
                recitedIndex += text.length;
                break;
                
            case DiffMatchPatch.DIFF_REPLACE:
                // 替换的部分（不同）
                originalOutput += `<span class="missing">${text}</span>`;
                recitedOutput += `<span class="extra">${text}</span>`;
                originalIndex += text.length;
                recitedIndex += text.length;
                break;
        }
    }
    
    return type === 'original' ? originalOutput : recitedOutput;
}

// 切换原文显示
function toggleOriginal() {
    if (elements.originalContainer.style.display === 'none') {
        elements.originalContainer.style.display = 'block';
        elements.showOriginalBtn.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏原文';
    } else {
        elements.originalContainer.style.display = 'none';
        elements.showOriginalBtn.innerHTML = '<i class="fas fa-eye"></i> 显示原文';
    }
}

// 重置默写
function resetRecite() {
    if (confirm('确定要重新开始默写吗？当前内容将被清除。')) {
        elements.recitedInput.value = '';
        elements.resultContainer.style.display = 'none';
        elements.originalContainer.style.display = 'none';
        elements.showOriginalBtn.innerHTML = '<i class="fas fa-eye"></i> 显示原文';
        startTimer();
    }
}

// 启动计时器
function startTimer() {
    stopTimer();
    state.startTime = Date.now();
    updateTimer();
    state.timerInterval = setInterval(updateTimer, 1000);
}

// 更新计时器显示
function updateTimer() {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    elements.timer.textContent = `${minutes}:${seconds}`;
}

// 停止计时器
function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// 打开删除确认模态框
function openDeleteModal(textId) {
    state.deleteCandidateId = textId;
    elements.deleteModal.style.display = 'flex';
}

// 关闭删除模态框
function closeDeleteModal() {
    elements.deleteModal.style.display = 'none';
    state.deleteCandidateId = null;
}

// 确认删除
function confirmDelete() {
    if (state.deleteCandidateId) {
        textManager.delete(state.deleteCandidateId);
        renderTextList();
    }
    closeDeleteModal();
}

// 切换视图模式（网格/列表）
function toggleViewMode() {
    const isGrid = elements.textsContainer.classList.toggle('list-view');
    elements.toggleViewBtn.innerHTML = isGrid ? 
        '<i class="fas fa-th"></i> 网格视图' : 
        '<i class="fas fa-list"></i> 列表视图';
}

// 辅助函数：截断文本
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// DiffMatchPatch 实现（简化版）
class DiffMatchPatch {
    constructor() {
        this.DIFF_DELETE = -1;
        this.DIFF_INSERT = 1;
        this.DIFF_EQUAL = 0;
        this.Diff_Timeout = 1.0;
        this.Diff_EditCost = 4;
        this.Match_Threshold = 0.5;
        this.Match_Distance = 1000;
        this.Patch_DeleteThreshold = 0.5;
        this.Patch_Margin = 4;
        this.Match_MaxBits = 32;
    }
    
    diff_main(text1, text2, checklines = true, deadline) {
        if (text1 === text2) {
            return [[this.DIFF_EQUAL, text1]];
        }
        
        if (!text1) {
            return [[this.DIFF_INSERT, text2]];
        }
        
        if (!text2) {
            return [[this.DIFF_DELETE, text1]];
        }
        
        const longtext = text1.length > text2.length ? text1 : text2;
        const shorttext = text1.length > text2.length ? text2 : text1;
        const i = longtext.indexOf(shorttext);
        
        if (i !== -1) {
            const diffs = [];
            if (i > 0) {
                diffs.push([this.DIFF_DELETE, longtext.substring(0, i)]);
            }
            diffs.push([this.DIFF_EQUAL, shorttext]);
            if (i + shorttext.length < longtext.length) {
                diffs.push([this.DIFF_DELETE, longtext.substring(i + shorttext.length)]);
            }
            return text1.length > text2.length ? diffs : diffs.map(d => [d[0] === this.DIFF_DELETE ? this.DIFF_INSERT : d[0] === this.DIFF_INSERT ? this.DIFF_DELETE : d[0], d[1]]);
        }
        
        if (shorttext.length === 1) {
            return [[this.DIFF_DELETE, text1], [this.DIFF_INSERT, text2]];
        }
        
        return this.diff_bisect(text1, text2, deadline);
    }
    
    diff_bisect(text1, text2, deadline) {
        const max_d = Math.ceil((text1.length + text2.length) / 2);
        const v_offset = max_d;
        const v_length = 2 * max_d;
        const v1 = new Array(v_length).fill(-1);
        const v2 = new Array(v_length).fill(-1);
        v1[v_offset + 1] = 0;
        v2[v_offset + 1] = 0;
        const delta = text1.length - text2.length;
        const front = (delta % 2 !== 0);
        let k1start = 0;
        let k1end = 0;
        let k2start = 0;
        let k2end = 0;
        
        for (let d = 0; d < max_d; d++) {
            for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
                const k1_offset = v_offset + k1;
                let x1;
                if (k1 === -d || (k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
                    x1 = v1[k1_offset + 1];
                } else {
                    x1 = v1[k1_offset - 1] + 1;
                }
                let y1 = x1 - k1;
                
                while (x1 < text1.length && y1 < text2.length && text1.charAt(x1) === text2.charAt(y1)) {
                    x1++;
                    y1++;
                }
                v1[k1_offset] = x1;
                if (x1 > text1.length) {
                    k1end += 2;
                } else if (y1 > text2.length) {
                    k1start += 2;
                } else if (front) {
                    const k2_offset = v_offset + delta - k1;
                    if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
                        const x2 = text1.length - v2[k2_offset];
                        if (x1 >= x2) {
                            return this.diff_bisectSplit(text1, text2, x1, y1);
                        }
                    }
                }
            }
            
            for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
                const k2_offset = v_offset + k2;
                let x2;
                if (k2 === -d || (k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
                    x2 = v2[k2_offset + 1];
                } else {
                    x2 = v2[k2_offset - 1] + 1;
                }
                let y2 = x2 - k2;
                
                while (x2 < text1.length && y2 < text2.length && 
                       text1.charAt(text1.length - x2 - 1) === text2.charAt(text2.length - y2 - 1)) {
                    x2++;
                    y2++;
                }
                v2[k2_offset] = x2;
                if (x2 > text1.length) {
                    k2end += 2;
                } else if (y2 > text2.length) {
                    k2start += 2;
                } else if (!front) {
                    const k1_offset = v_offset + delta - k2;
                    if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
                        const x1 = v1[k1_offset];
                        const y1 = v_offset + x1 - k1_offset;
                        const x2 = text1.length - x2;
                        if (x1 >= x2) {
                            return this.diff_bisectSplit(text1, text2, x1, y1);
                        }
                    }
                }
            }
        }
        
        return [[this.DIFF_DELETE, text1], [this.DIFF_INSERT, text2]];
    }
    
    diff_bisectSplit(text1, text2, x, y) {
        const text1a = text1.substring(0, x);
        const text2a = text2.substring(0, y);
        const text1b = text1.substring(x);
        const text2b = text2.substring(y);
        
        const diffs_a = this.diff_main(text1a, text2a);
        const diffs_b = this.diff_main(text1b, text2b);
        
        return diffs_a.concat(diffs_b);
    }
    
    diff_cleanupSemantic(diffs) {
        let changes = false;
        const equalities = [];
        let equalitiesLength = 0;
        let lastEquality = null;
        let pointer = 0;
        let length_insertions1 = 0;
        let length_deletions1 = 0;
        let length_insertions2 = 0;
        let length_deletions2 = 0;
        
        while (pointer < diffs.length) {
            if (diffs[pointer][0] === this.DIFF_EQUAL) {
                equalities[equalitiesLength++] = pointer;
                length_insertions1 = length_insertions2;
                length_deletions1 = length_deletions2;
                length_insertions2 = 0;
                length_deletions2 = 0;
                lastEquality = diffs[pointer][1];
            } else {
                if (diffs[pointer][0] === this.DIFF_INSERT) {
                    length_insertions2 += diffs[pointer][1].length;
                } else {
                    length_deletions2 += diffs[pointer][1].length;
                }
                
                if (lastEquality && lastEquality.length <= Math.max(length_insertions1, length_deletions1) && 
                    lastEquality.length <= Math.max(length_insertions2, length_deletions2)) {
                    
                    diffs.splice(equalities[equalitiesLength - 1], 0, [this.DIFF_DELETE, lastEquality]);
                    
                    diffs[equalities[equalitiesLength - 1] + 1][0] = this.DIFF_EQUAL;
                    
                    equalitiesLength--;
                    
                    pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
                    equalitiesLength--;
                    
                    length_insertions1 = 0;
                    length_deletions1 = 0;
                    length_insertions2 = 0;
                    length_deletions2 = 0;
                    lastEquality = null;
                    
                    changes = true;
                }
            }
            pointer++;
        }
        
        if (changes) {
            this.diff_cleanupMerge(diffs);
        }
    }
    
    diff_cleanupMerge(diffs) {
        diffs.push([this.DIFF_EQUAL, '']);
        let pointer = 0;
        let count_delete = 0;
        let count_insert = 0;
        let text_delete = '';
        let text_insert = '';
        
        while (pointer < diffs.length) {
            switch (diffs[pointer][0]) {
                case this.DIFF_INSERT:
                    count_insert++;
                    text_insert += diffs[pointer][1];
                    pointer++;
                    break;
                case this.DIFF_DELETE:
                    count_delete++;
                    text_delete += diffs[pointer][1];
                    pointer++;
                    break;
                case this.DIFF_EQUAL:
                    if (count_delete + count_insert > 1) {
                        if (count_delete !== 0 && count_insert !== 0) {
                            const common_length = this.diff_commonPrefix(text_insert, text_delete);
                            if (common_length !== 0) {
                                const common_string = text_insert.substring(0, common_length);
                                text_insert = text_insert.substring(common_length);
                                text_delete = text_delete.substring(common_length);
                                diffs.splice(pointer - count_delete - count_insert - 1, 0, [this.DIFF_EQUAL, common_string]);
                                pointer++;
                            }
                            
                            common_length = this.diff_commonSuffix(text_insert, text_delete);
                            if (common_length !== 0) {
                                const common_string = text_insert.substring(text_insert.length - common_length);
                                text_insert = text_insert.substring(0, text_insert.length - common_length);
                                text_delete = text_delete.substring(0, text_delete.length - common_length);
                                diffs.splice(pointer, 0, [this.DIFF_EQUAL, common_string]);
                                pointer++;
                            }
                        }
                        
                        pointer -= count_delete + count_insert;
                        diffs.splice(pointer, count_delete + count_insert);
                        
                        if (text_delete.length) {
                            diffs.splice(pointer, 0, [this.DIFF_DELETE, text_delete]);
                            pointer++;
                        }
                        
                        if (text_insert.length) {
                            diffs.splice(pointer, 0, [this.DIFF_INSERT, text_insert]);
                            pointer++;
                        }
                        
                        pointer++;
                    } else if (pointer !== 0 && diffs[pointer - 1][0] === this.DIFF_EQUAL) {
                        diffs[pointer - 1][1] += diffs[pointer][1];
                        diffs.splice(pointer, 1);
                    } else {
                        pointer++;
                    }
                    count_insert = 0;
                    count_delete = 0;
                    text_delete = '';
                    text_insert = '';
                    break;
            }
        }
        
        if (diffs[diffs.length - 1][1] === '') {
            diffs.pop();
        }
    }
    
    diff_commonPrefix(text1, text2) {
        const n = Math.min(text1.length, text2.length);
        for (let i = 0; i < n; i++) {
            if (text1.charAt(i) !== text2.charAt(i)) {
                return i;
            }
        }
        return n;
    }
    
    diff_commonSuffix(text1, text2) {
        const n = Math.min(text1.length, text2.length);
        for (let i = 1; i <= n; i++) {
            if (text1.charAt(text1.length - i) !== text2.charAt(text2.length - i)) {
                return i - 1;
            }
        }
        return n;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);
