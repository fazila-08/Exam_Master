/**
 * LET Study Tool - Enhanced Excel Integration
 * Complete implementation with improved error handling, data validation, and user feedback
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Global data storage
const appData = {
    flashcards: {
        civil: [],
        mechanical: [],
        electrical: [],
        electronics: [],
        programming: [],
        mathematics: [],
        mechanics: [],
        english: []
    },
    mockTests: {
        civil: [],
        mechanical: [],
        electrical: [],
        electronics: [],
        programming: [],
        mathematics: [],
        mechanics: [],
        english: []
    },
    currentSubject: 'civil',
    currentFlashcardIndex: 0,
    currentQuestionIndex: 0,
    testHistory: [],
    userSettings: {
        name: '',
        examDate: '',
        dailyHours: 2,
        subjectWeights: {
            civil: 3,
            mechanical: 3,
            electrical: 3,
            electronics: 3,
            programming: 3,
            mathematics: 3,
            mechanics: 3,
            english: 3
        }
    }
};

// Initialize the application
function initializeApp() {
    initializeTabs(); 
    loadSavedData();
    initializeFileUpload();
    initializeFlashcards();
    initializeMockTest();
    initializeCharts();
    setupEventListeners();
    updateUI();
}

// Load saved data from localStorage
function loadSavedData() {
    const loadData = (key, defaultValue) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };

    appData.flashcards = loadData('letStudyFlashcards', appData.flashcards);
    appData.mockTests = loadData('letStudyMockTests', appData.mockTests);
    appData.testHistory = loadData('letStudyTestHistory', []);
    appData.userSettings = loadData('letStudyUserSettings', appData.userSettings);
}

function initializeTabs() {
    document.querySelectorAll('.nav-items li').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.nav-items li').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize file upload functionality with improved UI
function initializeFileUpload() {
    const settingsTab = document.getElementById('settings');
    if (!settingsTab) return;

    const dataImportSection = document.createElement('div');
    dataImportSection.className = 'settings-section';
    dataImportSection.innerHTML = `
        <h3 class="settings-title">Data Import</h3>
        <div class="import-instructions">
            <p>Upload Excel/CSV files with properly formatted data:</p>
            <div class="template-links">
                <a href="#" id="download-flashcard-template">Download Flashcard Template</a>
                <a href="#" id="download-mocktest-template">Download Mock Test Template</a>
            </div>
        </div>
        
        <div class="import-forms">
            <div class="form-group">
                <label for="flashcard-file">Flashcards File</label>
                <input type="file" id="flashcard-file" class="form-control" accept=".xlsx,.xls,.csv">
                <small>Format: Subject | Question | Answer | Difficulty (optional)</small>
            </div>
            
            <div class="form-group">
                <label for="mocktest-file">Mock Test Questions File</label>
                <input type="file" id="mocktest-file" class="form-control" accept=".xlsx,.xls,.csv">
                <small>Format: Subject | Question | Option A | Option B | Option C | Option D | Correct Answer</small>
            </div>
        </div>
        
        <div class="import-controls">
            <button id="validate-files-btn" class="btn btn-outline">Validate Files</button>
            <button id="import-data-btn" class="btn btn-primary">Import Data</button>
        </div>
        
        <div id="import-status">
            <div class="progress-container" style="display: none;">
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
            <div class="import-summary" style="display: none;"></div>
        </div>
    `;

    settingsTab.appendChild(dataImportSection);

    // Event listeners
    document.getElementById('import-data-btn').addEventListener('click', importExcelData);
    document.getElementById('validate-files-btn').addEventListener('click', validateFiles);
    document.getElementById('download-flashcard-template').addEventListener('click', downloadFlashcardTemplate);
    document.getElementById('download-mocktest-template').addEventListener('click', downloadMockTestTemplate);
}

// Download template files
function downloadTemplate(data, fileName) {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadFlashcardTemplate() {
    const templateData = [
        ['Subject', 'Question', 'Answer', 'Difficulty'],
        ['Civil', 'What is the purpose of a slump test?', 'To measure concrete workability', 'Easy'],
        ['Mathematics', 'What is the formula for the area of a circle?', 'πr²', 'Medium']
    ];
    downloadTemplate(templateData.map(row => row.join(',')).join('\n'), 'flashcards_template.csv');
}

function downloadMockTestTemplate() {
    const templateData = [
        ['Subject', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Difficulty'],
        ['Civil', 'Slump test measures...', 'Strength', 'Workability', 'Durability', 'Color', 'B', 'Medium'],
        ['Programming', 'What does printf() do?', 'Input', 'Output', 'Calculate', 'Loop', 'B', 'Easy']
    ];
    downloadTemplate(templateData.map(row => row.join(',')).join('\n'), 'mocktest_template.csv');
}

// Validate files before import
async function validateFiles() {
    const flashcardFile = document.getElementById('flashcard-file').files[0];
    const mocktestFile = document.getElementById('mocktest-file').files[0];
    const statusElement = document.getElementById('import-status');
    
    statusElement.innerHTML = '<div class="validation-results"></div>';
    const resultsContainer = statusElement.querySelector('.validation-results');
    
    if (!flashcardFile && !mocktestFile) {
        resultsContainer.innerHTML = '<div class="alert alert-warning">Please select at least one file to validate</div>';
        return;
    }
    
    if (flashcardFile) {
        try {
            const data = await readExcelFile(flashcardFile);
            const { valid, errors } = validateFlashcardData(data);
            
            if (valid) {
                resultsContainer.innerHTML += `
                    <div class="alert alert-success">
                        Flashcard file is valid: ${data.length} records found
                    </div>
                `;
            } else {
                resultsContainer.innerHTML += `
                    <div class="alert alert-danger">
                        Flashcard file has ${errors.length} issues
                        <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
                    </div>
                `;
            }
        } catch (error) {
            resultsContainer.innerHTML += `
                <div class="alert alert-danger">
                    Error validating flashcard file: ${error.message}
                </div>
            `;
        }
    }
    
    if (mocktestFile) {
        try {
            const data = await readExcelFile(mocktestFile);
            const { valid, errors } = validateMockTestData(data);
            
            if (valid) {
                resultsContainer.innerHTML += `
                    <div class="alert alert-success">
                        Mock test file is valid: ${data.length} questions found
                    </div>
                `;
            } else {
                resultsContainer.innerHTML += `
                    <div class="alert alert-danger">
                        Mock test file has ${errors.length} issues
                        <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
                    </div>
                `;
            }
        } catch (error) {
            resultsContainer.innerHTML += `
                <div class="alert alert-danger">
                    Error validating mock test file: ${error.message}
                </div>
            `;
        }
    }
}

// Validate flashcard data structure
function validateFlashcardData(data) {
    const errors = [];
    const requiredFields = ['subject', 'question', 'answer'];
    
    data.forEach((row, index) => {
        const normalized = normalizeHeaders(row);
        
        // Check required fields
        requiredFields.forEach(field => {
            if (!normalized[field]) {
                errors.push(`Row ${index + 1}: Missing ${field}`);
            }
        });
        
        // Validate difficulty if present
        if (normalized.difficulty && !['easy', 'medium', 'hard'].includes(normalized.difficulty.toLowerCase())) {
            errors.push(`Row ${index + 1}: Invalid difficulty "${normalized.difficulty}"`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// Validate mock test data structure
function validateMockTestData(data) {
    const errors = [];
    const requiredFields = ['subject', 'question', 'optiona', 'optionb', 'optionc', 'optiond', 'correctanswer'];
    
    data.forEach((row, index) => {
        const normalized = normalizeHeaders(row);
        
        // Check required fields
        requiredFields.forEach(field => {
            if (!normalized[field]) {
                errors.push(`Row ${index + 1}: Missing ${field}`);
            }
        });
        
        // Validate correct answer
        if (normalized.correctanswer && !['a', 'b', 'c', 'd'].includes(normalized.correctanswer.toLowerCase())) {
            errors.push(`Row ${index + 1}: Invalid correct answer "${normalized.correctanswer}"`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// Import Excel data with progress tracking
async function importExcelData() {
    try {
        const flashcardFile = document.getElementById('flashcard-file').files[0];
        const mocktestFile = document.getElementById('mocktest-file').files[0];
        const statusElement = document.getElementById('import-status');
        
        if (!flashcardFile && !mocktestFile) {
            showToast('Please upload at least one file', 'error');
            return;
        }
        
        // Show progress UI
        statusElement.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
            <div class="import-summary"></div>
        `;
        
        const progressBar = statusElement.querySelector('.progress');
        const progressText = statusElement.querySelector('.progress-text');
        const summaryElement = statusElement.querySelector('.import-summary');
        
        let flashcardResults = { imported: 0, skipped: 0 };
        let mockTestResults = { imported: 0, skipped: 0 };
        
        // Process flashcard file
        if (flashcardFile) {
            const data = await readExcelFile(flashcardFile, (progress) => {
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            });
            
            flashcardResults = processFlashcardData(data);
            summaryElement.innerHTML += `
                <div class="alert alert-success">
                    Flashcards: Imported ${flashcardResults.imported}, skipped ${flashcardResults.skipped}
                </div>
            `;
        }
        
        // Process mock test file
        if (mocktestFile) {
            const data = await readExcelFile(mocktestFile, (progress) => {
                const currentProgress = flashcardFile ? 50 + progress / 2 : progress;
                progressBar.style.width = `${currentProgress}%`;
                progressText.textContent = `${currentProgress}%`;
            });
            
            mockTestResults = processMocktestData(data);
            summaryElement.innerHTML += `
                <div class="alert alert-success">
                    Mock Tests: Imported ${mockTestResults.imported}, skipped ${mockTestResults.skipped}
                </div>
            `;
        }
        
        // Complete progress
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        
        // Update UI with new data
        updateFlashcardUI();
        updateMockTestUI();
        updateStatistics();
        
        showToast('Data imported successfully!');
    } catch (error) {
        console.error("Import failed:", error);
        const statusElement = document.getElementById('import-status');
        statusElement.innerHTML = `
            <div class="alert alert-danger">
                Import failed: ${error.message}
                <br>Please check your file format and try again.
            </div>
        `;
        showToast('Import failed. Please check console for details.', 'error');
    }
}

// Read Excel/CSV file with progress callback
async function readExcelFile(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        reader.onload = function(e) {
            try {
                let data;
                if (fileExtension === 'csv') {
                    // Parse CSV with PapaParse
                    Papa.parse(e.target.result, {
                        header: true,
                        skipEmptyLines: true,
                        complete: function(results) {
                            if (progressCallback) progressCallback(100);
                            resolve(results.data.map(normalizeHeaders));
                        },
                        error: function(error) {
                            reject(error);
                        }
                    });
                } else {
                    // Parse Excel with SheetJS
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    data = XLSX.utils.sheet_to_json(worksheet);
                    
                    if (progressCallback) progressCallback(100);
                    resolve(data.map(normalizeHeaders));
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error("Failed to read file"));
        };
        
        if (fileExtension === 'csv') {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

// Normalize object keys to lowercase and trim whitespace
function normalizeHeaders(obj) {
    const normalized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const normalizedKey = key.toLowerCase().trim()
                .replace(/\s+/g, '')  // Remove spaces
                .replace(/[^a-z0-9]/g, '');  // Remove special chars
            normalized[normalizedKey] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
        }
    }
    return normalized;
}

function validateMockTestRow(row) {
    const requiredFields = ['subject', 'question', 'optiona', 'optionb', 'optionc', 'optiond', 'correctanswer'];
    const missingFields = requiredFields.filter(field => !row[field]);
    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    // Validate correct answer format
    const correctAnswer = String(row.correctanswer).toUpperCase().charAt(0);
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        return {
            isValid: false,
            message: `Invalid correct answer "${row.correctanswer}" - must be A, B, C, or D`
        };
    }

    // Validate at least 2 options are different
    const options = [
        row.optiona,
        row.optionb,
        row.optionc,
        row.optiond
    ];
    
    const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size < 2) {
        return {
            isValid: false,
            message: "At least two options must be meaningfully different"
        };
    }

    // Validate difficulty if present
    if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty.toLowerCase())) {
        return {
            isValid: false,
            message: `Invalid difficulty "${row.difficulty}" - must be easy, medium, or hard`
        };
    }

    return { isValid: true };
}

// Process flashcard data with duplicate detection
function processFlashcardData(data) {
    console.log("Raw flashcard data:", data); 
    const result = { imported: 0, skipped: 0 };
    const seenQuestions = new Set();
    
    data.forEach(row => {
        const normalized = normalizeHeaders(row);
        const { subject, question, answer, difficulty } = normalized;
        
        // Validate required fields
        if (!subject || !question || !answer) {
            result.skipped++;
            return;
        }
        
        // Check for duplicates
        const questionKey = `${subject.toLowerCase()}_${question.toLowerCase()}`;
        if (seenQuestions.has(questionKey)) {
            result.skipped++;
            return;
        }
        seenQuestions.add(questionKey);
        
        // Map subject to category
        const mappedSubject = mapSubjectToCategory(subject);
        if (!mappedSubject || !appData.flashcards[mappedSubject]) {
            result.skipped++;
            return;
        }
        
        // Add to flashcards
        appData.flashcards[mappedSubject].push({
            id: `${mappedSubject}-${appData.flashcards[mappedSubject].length}`,
            question: question,
            answer: answer,
            difficulty: difficulty ? difficulty.toLowerCase() : 'medium',
            mastery: 'new'
        });
        
        result.imported++;
    });
    
    localStorage.setItem('letStudyFlashcards', JSON.stringify(appData.flashcards));
    return result;
}

function processMocktestData(data) {
    const result = { imported: 0, skipped: 0, errors: [] };

    data.forEach((row, index) => {
        const normalized = normalizeHeaders(row);
        
        // Validate the row first
        const validation = validateMockTestRow(normalized);
        if (!validation.isValid) {
            result.skipped++;
            result.errors.push(`Row ${index + 1}: ${validation.message}`);
            return;
        }

        // Map subject to category
        const mappedSubject = mapSubjectToCategory(normalized.subject);
        if (!mappedSubject || !appData.mockTests[mappedSubject]) {
            result.skipped++;
            result.errors.push(`Row ${index + 1}: Invalid subject '${normalized.subject}'`);
            return;
        }

        // Process valid row
        appData.mockTests[mappedSubject].push({
            id: `${mappedSubject}-${appData.mockTests[mappedSubject].length}`,
            question: normalized.question,
            options: [
                normalized.optiona,
                normalized.optionb,
                normalized.optionc,
                normalized.optiond
            ],
            correctAnswer: normalized.correctanswer.toUpperCase().charAt(0),
            difficulty: normalized.difficulty ? normalized.difficulty.toLowerCase() : 'medium'
        });

        result.imported++;
    });

    // Show validation errors if any
    if (result.errors.length > 0) {
        console.warn("Mock test import issues:", result.errors);
        const statusElement = document.getElementById('import-status');
        if (statusElement) {
            statusElement.innerHTML += `
                <div class="alert alert-warning">
                    ${result.errors.length} validation issues found in mock test file
                    <button class="btn btn-sm" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden">
                        Show details
                    </button>
                    <div hidden>
                        ${result.errors.slice(0, 5).map(e => `<div>${e}</div>`).join('')}
                        ${result.errors.length > 5 ? `<div>+ ${result.errors.length - 5} more...</div>` : ''}
                    </div>
                </div>
            `;
        }
    }

    localStorage.setItem('letStudyMockTests', JSON.stringify(appData.mockTests));
    return result;
}
// Map various subject names to standard categories
function mapSubjectToCategory(subject) {
    if (!subject) return null;
    
    const subjectLower = subject.toLowerCase().trim();
    const subjectMap = {
        civil: ['civil', 'structure', 'building', 'survey', 'construction'],
        mechanical: ['mech', 'thermo', 'fluid', 'machine', 'mechanical'],
        electrical: ['electric', 'power', 'electrical'],
        electronics: ['electron', 'circuit', 'digital', 'semiconductor'],
        programming: ['program', 'coding', 'c programming', 'software'],
        mathematics: ['math', 'algebra', 'calculus', 'statistics'],
        mechanics: ['mechanics', 'statics', 'dynamics', 'kinetics'],
        english: ['english', 'grammar', 'verbal', 'language']
    };
    
    for (const [category, keywords] of Object.entries(subjectMap)) {
        if (keywords.some(keyword => subjectLower.includes(keyword))) {
            return category;
        }
    }
    
    return null;
}

// Initialize flashcards system
function initializeFlashcards() {
    const flashcardsTab = document.getElementById('flashcards');
    if (!flashcardsTab) return;
    
    flashcardsTab.innerHTML = `
        <div class="flashcard-controls">
            <div class="subject-filters">
                ${Object.keys(appData.flashcards).map(subject => `
                    <button class="subject-filter-btn" data-subject="${subject}">
                        ${subject.charAt(0).toUpperCase() + subject.slice(1)}
                        <span class="badge">0/0</span>
                    </button>
                `).join('')}
            </div>
            
            <div class="flashcard-nav">
                <button id="prev-flashcard-btn" class="btn btn-outline">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <button id="shuffle-flashcards-btn" class="btn btn-outline">
                    <i class="fas fa-random"></i> Shuffle
                </button>
                <button id="next-flashcard-btn" class="btn btn-outline">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        
        <div id="flashcard-container">
            <div class="empty-state">
                <i class="fas fa-file-excel"></i>
                <p>No flashcards available</p>
                <p>Upload an Excel file with flashcards in the Settings tab</p>
            </div>
        </div>
    `;
    
    updateFlashcardUI();
}

// Update flashcard UI with current data
function updateFlashcardUI() {
    updateFlashcardCounts();
    displayCurrentFlashcard();
}

// Display current flashcard
function displayCurrentFlashcard() {
    const container = document.getElementById('flashcard-container');
    const flashcards = appData.flashcards[appData.currentSubject];
    
    if (!flashcards || flashcards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-excel"></i>
                <p>No flashcards available for ${appData.currentSubject}</p>
                <p>Upload an Excel file with flashcards in the Settings tab</p>
            </div>
        `;
        return;
    }
    
    const card = flashcards[appData.currentFlashcardIndex];
    container.innerHTML = `
        <div class="flashcard ${card.mastery}" id="current-flashcard">
            <div class="flashcard-front">
                <div class="flashcard-subject">${appData.currentSubject.toUpperCase()}</div>
                <div class="flashcard-question">${card.question}</div>
                <div class="flashcard-difficulty ${card.difficulty}">${card.difficulty}</div>
                <button class="btn btn-outline flip-btn">Show Answer</button>
            </div>
            <div class="flashcard-back">
                <div class="flashcard-answer">${card.answer}</div>
                <div class="flashcard-controls">
                    <button class="btn btn-danger" id="difficult-btn">
                        <i class="fas fa-times"></i> Difficult
                    </button>
                    <button class="btn btn-success" id="mastered-btn">
                        <i class="fas fa-check"></i> Mastered
                    </button>
                </div>
                <button class="btn btn-outline flip-btn">Show Question</button>
            </div>
        </div>
        <div class="flashcard-progress">
            ${appData.currentFlashcardIndex + 1} of ${flashcards.length}
        </div>
    `;
    
    // Add event listeners
    document.querySelectorAll('.flip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('current-flashcard').classList.toggle('flipped');
        });
    });
    
    document.getElementById('difficult-btn').addEventListener('click', () => {
        updateFlashcardMastery('difficult');
    });
    
    document.getElementById('mastered-btn').addEventListener('click', () => {
        updateFlashcardMastery('mastered');
    });
}

// Update flashcard mastery status
function updateFlashcardMastery(status) {
    const flashcards = appData.flashcards[appData.currentSubject];
    const card = flashcards[appData.currentFlashcardIndex];
    
    if (status === 'mastered') {
        card.mastery = 'mastered';
    } else {
        card.mastery = 'learning';
    }
    
    // Move to next card
    appData.currentFlashcardIndex = (appData.currentFlashcardIndex + 1) % flashcards.length;
    
    // Save and update
    localStorage.setItem('letStudyFlashcards', JSON.stringify(appData.flashcards));
    displayCurrentFlashcard();
    updateFlashcardCounts();
}

// Update flashcard counts in UI
function updateFlashcardCounts() {
    const subjectCounts = {};
    
    // Calculate counts for each subject
    for (const subject in appData.flashcards) {
        const total = appData.flashcards[subject].length;
        const mastered = appData.flashcards[subject].filter(c => c.mastery === 'mastered').length;
        subjectCounts[subject] = { total, mastered };
    }
    
    // Update subject filter buttons
    document.querySelectorAll('.subject-filter-btn').forEach(btn => {
        const subject = btn.getAttribute('data-subject');
        const counts = subjectCounts[subject];
        const badge = btn.querySelector('.badge');
        
        if (badge && counts) {
            badge.textContent = `${counts.mastered}/${counts.total}`;
            
            // Update badge color based on mastery percentage
            const percentage = counts.total > 0 ? (counts.mastered / counts.total) * 100 : 0;
            badge.className = 'badge ' + (
                percentage >= 80 ? 'badge-success' :
                percentage >= 40 ? 'badge-warning' :
                'badge-danger'
            );
        }
        
        // Set active state
        btn.classList.toggle('active', subject === appData.currentSubject);
    });
    
    // Update dashboard stats
    const totalMastered = Object.values(subjectCounts).reduce((sum, c) => sum + c.mastered, 0);
    const totalCards = Object.values(subjectCounts).reduce((sum, c) => sum + c.total, 0);
    
    const dashboardMastered = document.querySelector('#dashboard .stat-card:nth-child(3) .stat-value');
    if (dashboardMastered) {
        dashboardMastered.textContent = `${totalMastered}/${totalCards}`;
    }
}

// Initialize mock test system
function initializeMockTest() {
    const mockTestTab = document.getElementById('mock-test');
    if (!mockTestTab) return;
    
    mockTestTab.innerHTML = `
        <div class="test-container">
            <div class="test-header">
                <h2>LET Mock Test</h2>
                <div class="timer">Time Remaining: 02:00:00</div>
            </div>
            
            <div class="test-body">
                <div class="question-container">
                    <div class="empty-state">
                        <i class="fas fa-file-excel"></i>
                        <p>No test questions available</p>
                        <p>Upload an Excel file with mock test questions in the Settings tab</p>
                    </div>
                </div>
            </div>
            
            <div class="test-footer">
                <div class="pagination"></div>
                <button id="start-test-btn" class="btn btn-primary">Start Test</button>
            </div>
        </div>
    `;
    
    document.getElementById('start-test-btn').addEventListener('click', () => {
        if (hasMockTestQuestions()) {
            generateRandomTest();
        } else {
            showToast('Please upload mock test questions first', 'error');
        }
    });
}

// Check if any mock test questions exist
function hasMockTestQuestions() {
    return Object.values(appData.mockTests).some(subject => subject.length > 0);
}

// Generate a random mock test with proper subject distribution
function generateRandomTest() {
    const subjectDistribution = {
        civil: 15, mechanical: 15,
        electrical: 15, electronics: 15,
        mathematics: 20, mechanics: 15,
        programming: 15, english: 10
    };
    
    appData.currentTest = {
        questions: [],
        userAnswers: [],
        startTime: new Date(),
        endTime: null,
        score: null
    };
    
    // Select random questions for each subject
    for (const subject in subjectDistribution) {
        const availableQuestions = appData.mockTests[subject];
        const count = Math.min(subjectDistribution[subject], availableQuestions.length);
        
        if (count > 0) {
            const selected = [];
            const indices = new Set();
            
            // Select unique random questions
            while (selected.length < count && indices.size < availableQuestions.length) {
                const randomIndex = Math.floor(Math.random() * availableQuestions.length);
                if (!indices.has(randomIndex)) {
                    indices.add(randomIndex);
                    selected.push(availableQuestions[randomIndex]);
                }
            }
            
            appData.currentTest.questions.push(...selected);
        }
    }
    
    // Shuffle all questions
    appData.currentTest.questions = shuffleArray(appData.currentTest.questions);
    appData.currentTest.userAnswers = new Array(appData.currentTest.questions.length).fill(null);
    appData.currentQuestionIndex = 0;
    
    // Update UI and start timer
    displayCurrentQuestion(0);
    startTestTimer();
}

// Display current question in mock test
function displayCurrentQuestion(index) {
    if (!appData.currentTest || index >= appData.currentTest.questions.length) return;
    
    appData.currentQuestionIndex = index;
    const question = appData.currentTest.questions[index];
    const container = document.querySelector('.question-container');
    
    container.innerHTML = `
        <div class="question-text">
            <strong>Question ${index + 1}:</strong> ${question.question}
        </div>
        <ul class="options-list">
            ${question.options.map((option, i) => `
                <li class="option-item ${appData.currentTest.userAnswers[index] === String.fromCharCode(65 + i) ? 'selected' : ''}" 
                    data-option="${String.fromCharCode(65 + i)}">
                    ${option}
                </li>
            `).join('')}
        </ul>
    `;
    
    // Add option selection handlers
    document.querySelectorAll('.option-item').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            appData.currentTest.userAnswers[index] = this.getAttribute('data-option');
        });
    });
    
    // Update pagination
    updatePagination(index);
    
    // Update next button
    const nextButton = document.querySelector('.test-footer .btn-primary');
    if (nextButton) {
        nextButton.textContent = index === appData.currentTest.questions.length - 1 ? 'Submit Test' : 'Next Question';
        nextButton.onclick = () => {
            if (index < appData.currentTest.questions.length - 1) {
                displayCurrentQuestion(index + 1);
            } else {
                finishTest();
            }
        };
    }
}

// Update pagination controls
function updatePagination(currentIndex) {
    const pagination = document.querySelector('.pagination');
    if (!pagination || !appData.currentTest) return;
    
    pagination.innerHTML = '';
    const totalQuestions = appData.currentTest.questions.length;
    const maxVisible = 5;
    
    // Always show first page
    addPageButton(pagination, 0, currentIndex);
    
    // Show pages around current index
    const start = Math.max(1, currentIndex - 2);
    const end = Math.min(totalQuestions - 1, currentIndex + 2);
    
    if (start > 1) pagination.appendChild(createEllipsis());
    
    for (let i = start; i <= end; i++) {
        if (i !== 0 && i !== totalQuestions - 1) {
            addPageButton(pagination, i, currentIndex);
        }
    }
    
    if (end < totalQuestions - 1) pagination.appendChild(createEllipsis());
    
    // Always show last page
    if (totalQuestions > 1) {
        addPageButton(pagination, totalQuestions - 1, currentIndex);
    }
}

function addPageButton(container, index, currentIndex) {
    const button = document.createElement('button');
    button.className = `page-btn ${index === currentIndex ? 'active' : ''}`;
    button.textContent = index + 1;
    button.addEventListener('click', () => displayCurrentQuestion(index));
    container.appendChild(button);
}

function createEllipsis() {
    const span = document.createElement('span');
    span.textContent = '...';
    return span;
}

// Start test timer
function startTestTimer() {
    if (appData.testTimerInterval) {
        clearInterval(appData.testTimerInterval);
    }
    
    const duration = 2 * 60 * 60 * 1000; // 2 hours
    const endTime = Date.now() + duration;
    
    const updateTimer = () => {
        const remaining = endTime - Date.now();
        
        if (remaining <= 0) {
            clearInterval(appData.testTimerInterval);
            finishTest();
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        document.querySelector('.timer').textContent = 
            `Time Remaining: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    updateTimer();
    appData.testTimerInterval = setInterval(updateTimer, 1000);
}

// Finish test and calculate results
function finishTest() {
    clearInterval(appData.testTimerInterval);
    appData.currentTest.endTime = new Date();
    
    // Calculate score
    let correct = 0;
    appData.currentTest.questions.forEach((q, i) => {
        if (appData.currentTest.userAnswers[i] === q.correctAnswer) {
            correct++;
        }
    });
    
    const score = Math.round((correct / appData.currentTest.questions.length) * 100);
    appData.currentTest.score = score;
    
    // Save to history
    appData.testHistory.push({
        date: new Date(),
        score: score,
        totalQuestions: appData.currentTest.questions.length,
        correctAnswers: correct
    });
    
    localStorage.setItem('letStudyTestHistory', JSON.stringify(appData.testHistory));
    showTestResults();
}

// Display test results
function showTestResults() {
    const test = appData.currentTest;
    const container = document.querySelector('.test-container');
    
    // Calculate subject performance
    const subjectPerformance = {};
    test.questions.forEach((q, i) => {
        const subject = q.id.split('-')[0];
        if (!subjectPerformance[subject]) {
            subjectPerformance[subject] = { total: 0, correct: 0 };
        }
        
        subjectPerformance[subject].total++;
        if (test.userAnswers[i] === q.correctAnswer) {
            subjectPerformance[subject].correct++;
        }
    });
    
    // Generate subject performance HTML
    const subjectRows = Object.entries(subjectPerformance).map(([subject, stats]) => {
        const percentage = Math.round((stats.correct / stats.total) * 100);
        return `
            <tr>
                <td>${subject.charAt(0).toUpperCase() + subject.slice(1)}</td>
                <td>${stats.correct}/${stats.total}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percentage}%; background-color: ${getScoreColor(percentage)};"></div>
                    </div>
                    <span>${percentage}%</span>
                </td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="test-header">
            <h2>Test Results</h2>
        </div>
        
        <div class="test-results-summary">
            <div class="overall-score" style="color: ${getScoreColor(test.score)}">
                ${test.score}%
            </div>
            <div class="score-detail">
                ${test.correctAnswers} out of ${test.questions.length} correct
            </div>
        </div>
        
        <div class="subject-performance">
            <h3>Subject Performance</h3>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjectRows}
                </tbody>
            </table>
        </div>
        
        <div class="test-result-actions">
            <button id="review-test-btn" class="btn btn-primary">Review Answers</button>
            <button id="new-test-btn" class="btn btn-outline">Take New Test</button>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('review-test-btn').addEventListener('click', reviewTest);
    document.getElementById('new-test-btn').addEventListener('click', generateRandomTest);
    
    // Update statistics
    updateStatistics();
}

// Review test answers
function reviewTest() {
    const test = appData.currentTest;
    const container = document.querySelector('.test-container');
    
    const questionReviews = test.questions.map((q, i) => {
        const userAnswer = test.userAnswers[i];
        const isCorrect = userAnswer === q.correctAnswer;
        
        return `
            <div class="question-review ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-text">
                    <strong>Question ${i + 1}:</strong> ${q.question}
                </div>
                
                <ul class="options-list">
                    ${q.options.map((opt, j) => {
                        const optionChar = String.fromCharCode(65 + j);
                        let optionClass = '';
                        if (optionChar === q.correctAnswer) optionClass = 'correct-answer';
                        if (optionChar === userAnswer && !isCorrect) optionClass = 'incorrect-answer';
                        
                        return `
                            <li class="option-item ${optionClass}">
                                ${opt}
                                ${optionChar === q.correctAnswer ? '<span class="answer-marker">✓ Correct</span>' : ''}
                                ${optionChar === userAnswer && !isCorrect ? '<span class="answer-marker">✗ Your answer</span>' : ''}
                            </li>
                        `;
                    }).join('')}
                </ul>
                
                ${!isCorrect ? `
                    <div class="correct-answer-note">
                        Correct answer: ${q.options[q.correctAnswer.charCodeAt(0) - 65]}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="test-header">
            <h2>Test Review</h2>
            <button id="back-to-results" class="btn btn-outline">Back to Summary</button>
        </div>
        
        <div class="test-review-questions">
            ${questionReviews}
        </div>
    `;
    
    document.getElementById('back-to-results').addEventListener('click', showTestResults);
}

// Get color based on score percentage
function getScoreColor(percentage) {
    return percentage >= 80 ? 'var(--success)' :
           percentage >= 60 ? 'var(--warning)' :
           'var(--danger)';
}

// Initialize charts
function initializeCharts() {
    // Progress chart
    const progressCtx = document.getElementById('progressChart')?.getContext('2d');
    if (progressCtx) {
        const subjects = Object.keys(appData.flashcards);
        const mastered = subjects.map(s => appData.flashcards[s].filter(c => c.mastery === 'mastered').length);
        const total = subjects.map(s => appData.flashcards[s].length);
        
        window.progressChart = new Chart(progressCtx, {
            type: 'bar',
            data: {
                labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [
                    {
                        label: 'Mastered',
                        data: mastered,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Total',
                        data: total,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }
    
    // History chart
    const historyCtx = document.getElementById('historyChart')?.getContext('2d');
    if (historyCtx && appData.testHistory.length > 0) {
        const labels = appData.testHistory.map((_, i) => `Test ${i + 1}`);
        const scores = appData.testHistory.map(t => t.score);
        
        window.historyChart = new Chart(historyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Test Scores',
                    data: scores,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    }
}

// Update statistics
function updateStatistics() {
    // Flashcard stats
    const totalFlashcards = Object.values(appData.flashcards).reduce((sum, s) => sum + s.length, 0);
    const masteredFlashcards = Object.values(appData.flashcards).reduce((sum, s) => sum + s.filter(c => c.mastery === 'mastered').length, 0);
    
    // Test stats
    const testCount = appData.testHistory.length;
    const avgScore = testCount > 0 
        ? Math.round(appData.testHistory.reduce((sum, t) => sum + t.score, 0) / testCount)
        : 0;
    
    // Update dashboard
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.querySelector('.stat-card:nth-child(1) .stat-value').textContent = totalFlashcards;
        dashboard.querySelector('.stat-card:nth-child(2) .stat-value').textContent = testCount;
        dashboard.querySelector('.stat-card:nth-child(3) .stat-value').textContent = `${masteredFlashcards}/${totalFlashcards}`;
        dashboard.querySelector('.stat-card:nth-child(4) .stat-value').textContent = `${avgScore}%`;
    }
    
    // Update charts
    updateCharts();
}

// Update charts with current data
function updateCharts() {
    if (window.progressChart) {
        const subjects = Object.keys(appData.flashcards);
        window.progressChart.data.datasets[0].data = subjects.map(s => appData.flashcards[s].filter(c => c.mastery === 'mastered').length);
        window.progressChart.data.datasets[1].data = subjects.map(s => appData.flashcards[s].length);
        window.progressChart.update();
    }
    
    if (window.historyChart && appData.testHistory.length > 0) {
        window.historyChart.data.labels = appData.testHistory.map((_, i) => `Test ${i + 1}`);
        window.historyChart.data.datasets[0].data = appData.testHistory.map(t => t.score);
        window.historyChart.update();
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }, 10);
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Set up event listeners
function setupEventListeners() {
    // Subject filter buttons
    document.querySelectorAll('.subject-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            if (subject && appData.flashcards[subject]) {
                appData.currentSubject = subject;
                appData.currentFlashcardIndex = 0;
                displayCurrentFlashcard();
                
                // Update active button
                document.querySelectorAll('.subject-filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Flashcard navigation
    document.getElementById('prev-flashcard-btn')?.addEventListener('click', () => {
        const flashcards = appData.flashcards[appData.currentSubject];
        if (flashcards.length > 0) {
            appData.currentFlashcardIndex = (appData.currentFlashcardIndex - 1 + flashcards.length) % flashcards.length;
            displayCurrentFlashcard();
        }
    });
    
    document.getElementById('next-flashcard-btn')?.addEventListener('click', () => {
        const flashcards = appData.flashcards[appData.currentSubject];
        if (flashcards.length > 0) {
            appData.currentFlashcardIndex = (appData.currentFlashcardIndex + 1) % flashcards.length;
            displayCurrentFlashcard();
        }
    });
    
    // Shuffle flashcards
    document.getElementById('shuffle-flashcards-btn')?.addEventListener('click', () => {
        const flashcards = appData.flashcards[appData.currentSubject];
        if (flashcards.length > 0) {
            shuffleArray(flashcards);
            appData.currentFlashcardIndex = 0;
            displayCurrentFlashcard();
            showToast('Flashcards shuffled');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Flashcard navigation
        if (document.getElementById('flashcards')?.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                document.getElementById('prev-flashcard-btn').click();
            } else if (e.key === 'ArrowRight') {
                document.getElementById('next-flashcard-btn').click();
            } else if (e.key === ' ') {
                document.querySelector('.flip-btn')?.click();
                e.preventDefault();
            }
        }
        
        // Mock test navigation
        if (document.getElementById('mock-test')?.classList.contains('active')) {
            if (e.key >= '1' && e.key <= '9') {
                const pageBtns = document.querySelectorAll('.page-btn');
                const index = parseInt(e.key) - 1;
                if (index < pageBtns.length) {
                    pageBtns[index].click();
                }
            }
        }
    });
}

function updateMockTestUI() {
    const mockTestTab = document.getElementById('mock-test');
    if (!mockTestTab) return;

    // Check if mock test container already exists
    if (!mockTestTab.querySelector('.test-container')) {
        initializeMockTest();
    }

    // Update any dynamic elements if needed
    const startButton = document.getElementById('start-test-btn');
    if (startButton) {
        startButton.disabled = !hasMockTestQuestions();
    }
}

// Update all UI elements
function updateUI() {
    updateFlashcardUI();
    updateMockTestUI();
    updateStatistics();
}