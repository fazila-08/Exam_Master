/**
 * LET Study Tool - Enhanced Excel Integration (Fixed Version)
 * Complete implementation with improved error handling, data validation, and user feedback
 * Fixed: Question selection, flashcard flipping, and UI consistency
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
    currentTest: null,
    testTimerInterval: null,
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

// Load saved data from localStorage (Fixed to not use localStorage in artifacts)
function loadSavedData() {
    // In artifact environment, we'll start with empty data
    // This would normally load from localStorage in a real environment
    console.log('Loading saved data...');
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
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
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
    const blob = new Blob([data], { type: 'text/csv' });
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
        // Check required fields
        requiredFields.forEach(field => {
            if (!row[field]) {
                errors.push(`Row ${index + 1}: Missing ${field}`);
            }
        });
        
        // Validate difficulty if present
        if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty.toLowerCase())) {
            errors.push(`Row ${index + 1}: Invalid difficulty "${row.difficulty}"`);
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
        // Check required fields
        requiredFields.forEach(field => {
            if (!row[field]) {
                errors.push(`Row ${index + 1}: Missing ${field}`);
            }
        });
        
        // Validate correct answer
        if (row.correctanswer && !['a', 'b', 'c', 'd'].includes(row.correctanswer.toLowerCase())) {
            errors.push(`Row ${index + 1}: Invalid correct answer "${row.correctanswer}"`);
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

// Process flashcard data with duplicate detection
function processFlashcardData(data) {
    console.log("Raw flashcard data:", data); 
    const result = { imported: 0, skipped: 0 };
    const seenQuestions = new Set();
    
    data.forEach(row => {
        const { subject, question, answer, difficulty } = row;
        
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
    
    return result;
}

function processMocktestData(data) {
    const result = { imported: 0, skipped: 0, errors: [] };

    data.forEach((row, index) => {
        // Validate the row first
        const validation = validateMockTestRow(row);
        if (!validation.isValid) {
            result.skipped++;
            result.errors.push(`Row ${index + 1}: ${validation.message}`);
            return;
        }

        // Map subject to category
        const mappedSubject = mapSubjectToCategory(row.subject);
        if (!mappedSubject || !appData.mockTests[mappedSubject]) {
            result.skipped++;
            result.errors.push(`Row ${index + 1}: Invalid subject '${row.subject}'`);
            return;
        }

        // Process valid row
        appData.mockTests[mappedSubject].push({
            id: `${mappedSubject}-${appData.mockTests[mappedSubject].length}`,
            question: row.question,
            options: [
                row.optiona,
                row.optionb,
                row.optionc,
                row.optiond
            ],
            correctAnswer: row.correctanswer.toUpperCase().charAt(0),
            difficulty: row.difficulty ? row.difficulty.toLowerCase() : 'medium'
        });

        result.imported++;
    });

    return result;
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

    return { isValid: true };
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

// Initialize flashcards system (FIXED)
function initializeFlashcards() {
    const flashcardsTab = document.getElementById('flashcards');
    if (!flashcardsTab) return;
    
    flashcardsTab.innerHTML = `
        <div class="flashcard-controls">
            <div class="subject-filters">
                ${Object.keys(appData.flashcards).map(subject => `
                    <button class="subject-filter-btn ${subject === appData.currentSubject ? 'active' : ''}" data-subject="${subject}">
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
    
    // Add subject filter event listeners immediately
    document.querySelectorAll('.subject-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            if (subject && appData.flashcards[subject]) {
                appData.currentSubject = subject;
                appData.currentFlashcardIndex = 0;
                
                // Update active button
                document.querySelectorAll('.subject-filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                displayCurrentFlashcard();
            }
        });
    });
    
    updateFlashcardUI();
}

// Display current flashcard (FIXED FLIPPING LOGIC)
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
        <div class="flashcard-wrapper">
            <div class="flashcard ${card.mastery}" id="current-flashcard">
                <div class="flashcard-inner">
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
            </div>
            <div class="flashcard-progress">
                ${appData.currentFlashcardIndex + 1} of ${flashcards.length}
            </div>
        </div>
    `;
    
    // Add event listeners for flip buttons (FIXED)
    document.querySelectorAll('.flip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const flashcard = document.getElementById('current-flashcard');
            if (flashcard) {
                flashcard.classList.toggle('flipped');
            }
        });
    });
    
    // Add mastery button listeners
    const difficultBtn = document.getElementById('difficult-btn');
    const masteredBtn = document.getElementById('mastered-btn');
    
    if (difficultBtn) {
        difficultBtn.addEventListener('click', () => updateFlashcardMastery('difficult'));
    }
    
    if (masteredBtn) {
        masteredBtn.addEventListener('click', () => updateFlashcardMastery('mastered'));
    }
}

// Update flashcard mastery status
function updateFlashcardMastery(status) {
    const flashcards = appData.flashcards[appData.currentSubject];
    if (!flashcards || flashcards.length === 0) return;
    
    const card = flashcards[appData.currentFlashcardIndex];
    
    if (status === 'mastered') {
        card.mastery = 'mastered';
    } else {
        card.mastery = 'learning';
    }
    
    // Move to next card
    appData.currentFlashcardIndex = (appData.currentFlashcardIndex + 1) % flashcards.length;
    
    // Update display
    displayCurrentFlashcard();
    updateFlashcardCounts();
}

// Update flashcard UI with current data
function updateFlashcardUI() {
    updateFlashcardCounts();
    displayCurrentFlashcard();
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
    });
    
    // Update dashboard stats
    const totalMastered = Object.values(subjectCounts).reduce((sum, c) => sum + c.mastered, 0);
    const totalCards = Object.values(subjectCounts).reduce((sum, c) => sum + c.total, 0);
    
    const dashboardMastered = document.querySelector('#dashboard .stat-card:nth-child(3) .stat-value');
    if (dashboardMastered) {
        dashboardMastered.textContent = `${totalMastered}/${totalCards}`;
    }
}

// Initialize mock test system (FIXED QUESTION SELECTION)
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
                <div class="test-controls">
                    <button id="start-test-btn" class="btn btn-primary">Start Test</button>
                    <button id="prev-question-btn" class="btn btn-outline" style="display: none;">Previous</button>
                    <button id="next-question-btn" class="btn btn-primary" style="display: none;">Next</button>
                </div>
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

// Generate a random mock test with proper subject distribution (FIXED)
function generateRandomTest() {
    const subjectDistribution = {
        civil: { count: 15, difficulties: { easy: 0.4, medium: 0.4, hard: 0.2 } },
        mechanical: { count: 15, difficulties: { easy: 0.4, medium: 0.4, hard: 0.2 } },
        electrical: { count: 15, difficulties: { easy: 0.4, medium: 0.4, hard: 0.2 } },
        electronics: { count: 15, difficulties: { easy: 0.4, medium: 0.4, hard: 0.2 } },
        programming: { count: 15, difficulties: { easy: 0.4, medium: 0.4, hard: 0.2 } },
        mathematics: { count: 20, difficulties: { easy: 0.3, medium: 0.4, hard: 0.3 } },
        mechanics: { count: 15, difficulties: { easy: 0.4, medium: 0.4, hard: 0.2 } },
        english: { count: 10, difficulties: { easy: 0.5, medium: 0.3, hard: 0.2 } }
    };

    appData.currentTest = {
        questions: [],
        userAnswers: [],
        startTime: new Date(),
        endTime: null,
        score: null
    };

    // Select questions for each subject with difficulty distribution
    for (const [subject, config] of Object.entries(subjectDistribution)) {
        const availableQuestions = appData.mockTests[subject];
        if (!availableQuestions || availableQuestions.length === 0) continue;

        // Filter by difficulty
        const easyQs = availableQuestions.filter(q => q.difficulty === 'easy');
        const mediumQs = availableQuestions.filter(q => q.difficulty === 'medium');
        const hardQs = availableQuestions.filter(q => q.difficulty === 'hard');

        // Calculate target counts for each difficulty
        const easyCount = Math.min(
            Math.floor(config.count * config.difficulties.easy),
            easyQs.length
        );
        const mediumCount = Math.min(
            Math.floor(config.count * config.difficulties.medium),
            mediumQs.length
        );
        const hardCount = Math.min(
            config.count - easyCount - mediumCount,
            hardQs.length
        );

        // Select random questions for each difficulty
        const selected = [
            ...selectRandomQuestions(easyQs, easyCount),
            ...selectRandomQuestions(mediumQs, mediumCount),
            ...selectRandomQuestions(hardQs, hardCount)
        ];

        appData.currentTest.questions.push(...selected);
    }

    // Shuffle all questions
    appData.currentTest.questions = shuffleArray(appData.currentTest.questions);
    appData.currentTest.userAnswers = new Array(appData.currentTest.questions.length).fill(null);
    appData.currentQuestionIndex = 0;
    
    // Update UI
    document.getElementById('start-test-btn').style.display = 'none';
    document.getElementById('prev-question-btn').style.display = 'none'; // Hide initially for first question
    document.getElementById('next-question-btn').style.display = 'inline-block';
    document.getElementById('next-question-btn').textContent = 'Next Question';

    displayCurrentQuestion(0);
    startTestTimer();
}

function selectRandomQuestions(questions, count) {
    if (count <= 0 || !questions || questions.length === 0) return [];
    if (questions.length <= count) return [...questions];

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Display current question in mock test (FIXED)
function displayCurrentQuestion(index) {
    if (!appData.currentTest || index < 0 || index >= appData.currentTest.questions.length) return;

    appData.currentQuestionIndex = index;
    const question = appData.currentTest.questions[index];
    const userAnswer = appData.currentTest.userAnswers[index];
    const container = document.querySelector('.question-container');

    container.innerHTML = `
        <div class="question-text">
            <strong>Question ${index + 1}:</strong> ${question.question}
        </div>
        <ul class="options-list">
            ${question.options.map((option, i) => {
                const optionChar = String.fromCharCode(65 + i);
                const isSelected = userAnswer === optionChar;
                const isCorrectAnswer = optionChar === question.correctAnswer;
                
                // Only show correct/incorrect if test is finished
                let optionClass = '';
                if (appData.currentTest.endTime) {
                    if (isCorrectAnswer) optionClass = 'correct-answer';
                    else if (isSelected && !isCorrectAnswer) optionClass = 'incorrect-answer';
                }
                
                return `
                    <li class="option-item ${isSelected ? 'selected' : ''} ${optionClass}" 
                        data-option="${optionChar}">
                        <span class="option-letter">${optionChar}.</span> ${option}
                        ${appData.currentTest.endTime && isCorrectAnswer ? 
                          '<span class="answer-marker">✓ Correct</span>' : ''}
                        ${appData.currentTest.endTime && isSelected && !isCorrectAnswer ? 
                          '<span class="answer-marker">✗ Your answer</span>' : ''}
                    </li>
                `;
            }).join('')}
        </ul>
    `;

    // Add option selection handlers
    if (!appData.currentTest.endTime) {
        document.querySelectorAll('.option-item').forEach(option => {
            option.addEventListener('click', function() {
                // Clear previous selection
                document.querySelectorAll('.option-item').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Set new selection
                this.classList.add('selected');
                appData.currentTest.userAnswers[index] = this.getAttribute('data-option');
            });
        });
    }

    // Update pagination
    updatePagination(index);

    // Update navigation buttons
    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');

    prevBtn.style.display = index === 0 ? 'none' : 'inline-block';
    nextBtn.textContent = index === appData.currentTest.questions.length - 1 
        ? 'Submit Test' 
        : 'Next Question';

    prevBtn.onclick = () => {
        displayCurrentQuestion(index - 1);
    };
    
    nextBtn.onclick = () => {
        if (index < appData.currentTest.questions.length - 1) {
            displayCurrentQuestion(index + 1);
        } else {
            finishTest();
        }
    };
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
    span.style.margin = '0 5px';
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
        const correctOption = q.options[q.correctAnswer.charCodeAt(0) - 65];

        return `
            <div class="question-review ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-text">
                    <strong>Question ${i + 1}:</strong> ${q.question}
                </div>
                
                <ul class="options-list">
                    ${q.options.map((opt, j) => {
                        const optionChar = String.fromCharCode(65 + j);
                        let optionClass = '';
                        let marker = '';
                        
                        if (optionChar === q.correctAnswer) {
                            optionClass = 'correct-answer';
                            marker = '<span class="answer-marker">✓ Correct</span>';
                        } else if (optionChar === userAnswer && !isCorrect) {
                            optionClass = 'incorrect-answer';
                            marker = '<span class="answer-marker">✗ Your answer</span>';
                        }
                        
                        return `
                            <li class="option-item ${optionClass}">
                                <span class="option-letter">${optionChar}.</span> ${opt}
                                ${marker}
                            </li>
                        `;
                    }).join('')}
                </ul>
                
                ${!isCorrect ? `
                    <div class="correct-answer-note">
                        Correct answer: <strong>${correctOption}</strong>
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
    return percentage >= 80 ? '#28a745' :
           percentage >= 60 ? '#ffc107' :
           '#dc3545';
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
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Set up event listeners
function setupEventListeners() {
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Flashcard controls
        if (document.getElementById('flashcards')?.classList.contains('active')) {
            switch (e.key) {
                case 'ArrowLeft':
                    document.getElementById('prev-flashcard-btn')?.click();
                    break;
                case 'ArrowRight':
                    document.getElementById('next-flashcard-btn')?.click();
                    break;
                case ' ':
                    e.preventDefault();
                    document.querySelector('.flip-btn')?.click();
                    break;
                case 'm':
                    document.getElementById('mastered-btn')?.click();
                    break;
                case 'd':
                    document.getElementById('difficult-btn')?.click();
                    break;
            }
        }
        
        // Test controls
        if (document.getElementById('mock-test')?.classList.contains('active')) {
            switch (e.key) {
                case '1':
                case '2':
                case '3':
                case '4':
                    const optionIndex = parseInt(e.key) - 1;
                    const options = document.querySelectorAll('.option-item');
                    if (optionIndex < options.length) {
                        options[optionIndex].click();
                    }
                    break;
                case 'Enter':
                    document.getElementById('next-question-btn')?.click();
                    break;
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