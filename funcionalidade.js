// ARQUIVO: funcionalidade.js
// DESCRIÇÃO: Lógica de gamificação e interação

// Variáveis globais a partir do DATABASE (assumindo que bd.js foi carregado antes)
  const replit =''; // URL do projeto no Replit.com.
let users = DATABASE.users;
let goals = DATABASE.weeklyGoals;
let selectedUsers = [];
let currentUserId = 1; // Usuário logado (Ana Paula)


// FUNÇÕES AUXILIARES

function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getRankClass(index) {
    const classes = ['rank-1', 'rank-2', 'rank-3', 'rank-other'];
    return classes[index] || 'rank-other';
}

function calculateProgress(user) {
    return Math.min((user.xp / user.xpToNextLevel) * 100, 100);
}

// RENDERIZAR RANKING

function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    container.innerHTML = users.map((user, index) => {
        const progress = calculateProgress(user);
        const isSelected = selectedUsers.some(u => u.id === user.id);
        const isCurrentUser = user.id === currentUserId;
        
        // As chamadas onclick agora são definidas aqui no JS
        const onClickHandler = `selectUser(${user.id})`;

        return `
            <div class="card user-card ${isSelected ? 'selected' : ''}" 
                 onclick="${onClickHandler}"
                 style="${isCurrentUser ? 'border: 2px solid gold;' : ''}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <div class="rank-badge ${getRankClass(index)}">#${index + 1}</div>
                        </div>
                        <div class="col-auto">
                            <div class="avatar">${user.avatar}</div>
                        </div>
                        <div class="col">
                            <h5 class="mb-1">
                                ${user.name}
                                ${isCurrentUser ? '<span class="badge bg-warning text-dark ms-2">VOCÊ</span>' : ''}
                            </h5>
                            <div class="mb-2">
                                ${user.achievements.slice(0, 2).map(a => 
                                    `<span class="badge bg-warning text-dark me-1">${a}</span>`
                                ).join('')}
                            </div>
                            <div class="xp-bar">
                                <div class="xp-progress" style="width: ${progress}%">
                                    Nível ${user.level} - ${user.xp}/${user.xpToNextLevel} XP
                                </div>
                            </div>
                            <small class="text-muted">
                                💵 ${formatMoney(user.moneySaved)} | 🗓️ ${user.savingStreak}d
                            </small>
                        </div>
                        <div class="col-auto text-end">
                            <h3 class="text-primary mb-0">${user.xp.toLocaleString()}</h3>
                            <small class="text-muted">XP</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// RENDERIZAR METAS SEMANAIS

function renderGoals() {
    const container = document.getElementById('weekly-goals');
    const user = users.find(u => u.id === currentUserId);
    
    container.innerHTML = goals.map(goal => {
        const completed = user.completedGoals.includes(goal.id);
        const onClickHandler = `completeGoal(${goal.id})`;

        return `
            <div class="goal-card ${completed ? 'completed' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <span style="font-size: 30px; margin-right: 10px;">${goal.icon}</span>
                        <strong>${goal.title}</strong>
                        <div class="badge bg-warning text-dark mt-2">+${goal.xp} XP</div>
                    </div>
                    <div>
                        ${completed 
                            ? '<span class="badge bg-success fs-6 p-2">✓ Completo</span>'
                            : `<button class="btn btn-success" onclick="${onClickHandler}">Completar</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Atualizar progresso
    const completed = user.completedGoals.length;
    const xpGained = user.completedGoals.reduce((sum, id) => {
        const g = goals.find(goal => goal.id === id);
        return sum + (g ? g.xp : 0);
    }, 0);

    document.getElementById('progress').textContent = `${completed}/${goals.length}`;
    document.getElementById('xp-gained').textContent = `+${xpGained} XP`;
}


// COMPLETAR META

function completeGoal(goalId) {
    const user = users.find(u => u.id === currentUserId);
    
    if (user.completedGoals.includes(goalId)) {
        alert('Você já completou esta meta!');
        return;
    }

    const goal = goals.find(g => g.id === goalId);
    
    // Adicionar XP
    user.xp += goal.xp;
    user.completedGoals.push(goalId);
    user.weeklyGoalsCompleted++;

    // Level up?
    if (user.xp >= user.xpToNextLevel) {
        user.level++;
        user.xpToNextLevel = Math.floor(user.xpToNextLevel * 1.5);
        alert(`🎉 Parabéns! Você subiu para o nível ${user.level}!`);
    } else {
        alert(`✅ Meta completada! +${goal.xp} XP`);
    }

    // Reordenar ranking
    users.sort((a, b) => b.xp - a.xp);

    // Atualizar tela
    renderLeaderboard();
    renderGoals();
    renderStats();
}

// SELEÇÃO DE USUÁRIOS

function selectUser(userId) {
    const user = users.find(u => u.id === userId);
    const index = selectedUsers.findIndex(u => u.id === userId);
    
    if (index > -1) {
        selectedUsers.splice(index, 1);
    } else if (selectedUsers.length < 2) {
        selectedUsers.push(user);
    } else {
        selectedUsers.shift();
        selectedUsers.push(user);
    }
    
    updateSelection();
    renderLeaderboard();
}

function updateSelection() {
    const container = document.getElementById('selected-users');
    const btn = document.getElementById('compare-btn');
    
    if (selectedUsers.length === 0) {
        container.innerHTML = '<p class="text-muted small">Clique nos usuários</p>';
        btn.disabled = true;
    } else {
        container.innerHTML = selectedUsers.map(u => `
            <div class="alert alert-info p-2 mb-2">
                <strong>${u.name}</strong><br>
                <small>${formatMoney(u.moneySaved)}</small>
            </div>
        `).join('');
        btn.disabled = selectedUsers.length !== 2;
    }
    
    document.querySelector('.col-lg-4 h5').textContent = `⚔️ Comparar (${selectedUsers.length}/2)`;
}


// MOSTRAR COMPARAÇÃO

function showComparison() {
    if (selectedUsers.length !== 2) return;

    const [u1, u2] = selectedUsers;
    const maxMoney = Math.max(u1.moneySaved, u2.moneySaved);
    const maxXP = Math.max(u1.xp, u2.xp);

    document.getElementById('comparison').style.display = 'block';
    document.getElementById('comparison').innerHTML = `
        <div class="comparison-section">
            <h3 class="text-center mb-4">⚔️ Comparação Detalhada</h3>
            
            <div class="row text-center mb-4">
                <div class="col-6">
                    <div class="avatar mx-auto mb-2" style="width: 80px; height: 80px; font-size: 32px;">${u1.avatar}</div>
                    <h5>${u1.name}</h5>
                    <p>Nível ${u1.level}</p>
                </div>
                <div class="col-6">
                    <div class="avatar mx-auto mb-2" style="width: 80px; height: 80px; font-size: 32px;">${u2.avatar}</div>
                    <h5>${u2.name}</h5>
                    <p>Nível ${u2.level}</p>
                </div>
            </div>

            <div class="stat-box">
                <h6>💵 Dinheiro Economizado</h6>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${(u1.moneySaved/maxMoney)*100}%">
                        ${formatMoney(u1.moneySaved)}
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${(u2.moneySaved/maxMoney)*100}%">
                        ${formatMoney(u2.moneySaved)}
                    </div>
                </div>
            </div>

            <div class="stat-box">
                <h6>⭐ Experiência (XP)</h6>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${(u1.xp/maxXP)*100}%">
                        ${u1.xp} XP
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${(u2.xp/maxXP)*100}%">
                        ${u2.xp} XP
                    </div>
                </div>
            </div>

            <div class="row text-center">
                <div class="col-6 col-md-3">
                    <div class="stat-box">
                        <small>📈 Investimentos</small>
                        <h6>${u1.name.split(' ')[0]}</h6>
                        <p class="mb-0">${formatMoney(u1.investments)}</p>
                        <h6 class="mt-3">${u2.name.split(' ')[0]}</h6>
                        <p class="mb-0">${formatMoney(u2.investments)}</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-box">
                        <small>🎯 Metas</small>
                        <h6>${u1.name.split(' ')[0]}</h6>
                        <p class="mb-0">${u1.weeklyGoalsCompleted}</p>
                        <h6 class="mt-3">${u2.name.split(' ')[0]}</h6>
                        <p class="mb-0">${u2.weeklyGoalsCompleted}</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-box">
                        <small>🔥 Streak</small>
                        <h6>${u1.name.split(' ')[0]}</h6>
                        <p class="mb-0">${u1.savingStreak}d</p>
                        <h6 class="mt-3">${u2.name.split(' ')[0]}</h6>
                        <p class="mb-0">${u2.savingStreak}d</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-box">
                        <small>🌟 Nível</small>
                        <h6>${u1.name.split(' ')[0]}</h6>
                        <p class="mb-0">${u1.level}</p>
                        <h6 class="mt-3">${u2.name.split(' ')[0]}</h6>
                        <p class="mb-0">${u2.level}</p>
                    </div>
                </div>
            </div>

            <div class="text-center mt-4 p-3 rounded" style="background: rgba(255,255,255,0.3);">
                <h4>🏆 Melhor Poupador</h4>
                <h3>${u1.moneySaved > u2.moneySaved ? u1.name : u2.name}</h3>
                <p>Diferença: ${formatMoney(Math.abs(u1.moneySaved - u2.moneySaved))}</p>
            </div>
        </div>
    `;

    document.getElementById('comparison').scrollIntoView({ behavior: 'smooth' });
}


// ESTATÍSTICAS GLOBAIS

function renderStats() {
    const totalMoney = users.reduce((sum, u) => sum + u.moneySaved, 0);
    const totalXP = users.reduce((sum, u) => sum + u.xp, 0);
    const avgMoney = totalMoney / users.length;

    document.getElementById('stats').innerHTML = `
        <div class="mb-3">
            <small class="text-muted">Total Economizado</small>
            <h5 class="text-success">${formatMoney(totalMoney)}</h5>
        </div>
        <div class="mb-3">
            <small class="text-muted">XP Total</small>
            <h5 class="text-primary">${totalXP.toLocaleString()}</h5>
        </div>
        <div class="mb-3">
            <small class="text-muted">Média por Pessoa</small>
            <h5>${formatMoney(avgMoney)}</h5>
        </div>
        <div>
            <small class="text-muted">Total de Usuários</small>
            <h5>${users.length}</h5>
        </div>
    `;
}

// TIMER DAS METAS (SIMULADO)

function updateTimer() {
    // Simula 7 dias
    document.getElementById('timer').textContent = '7d 0h 0m';
}

document.addEventListener('DOMContentLoaded', () => {

    users.sort((a, b) => b.xp - a.xp);
    
    renderLeaderboard();
    renderGoals();
    renderStats();
    updateSelection();
    updateTimer();
});