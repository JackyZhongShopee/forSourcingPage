const EXCHANGE_RATE = { CNY: 1.42, USD: 0.20 };
let allData = [];

async function init() {
    try {
        const configRes = await fetch('./config.json');
        const config = await configRes.json();
        document.title = config.siteTitle;
        document.getElementById('siteTitle').innerText = config.siteTitle;
        document.getElementById('siteDesc').innerText = config.siteDesc;

        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // 确保数据存在，并处理可能的列名空格问题
                allData = results.data.map(row => {
                    const newRow = {};
                    for (let key in row) {
                        newRow[key.trim()] = row[key]; // 去除列名两端可能存在的空格
                    }
                    return newRow;
                });
                updateFilters(allData);
                renderCards(allData);
            }
        });
    } catch (err) { console.error(err); }
}

function updateFilters(data) {
    const fields = {
        priorityFilter: 'Priority',
        clusterFilter: 'Cluster',
        l1Filter: 'L1',
        l2Filter: 'L2',
        typeFilter: '建议卖家类型 (3PF/SLS/不限)'
    };

    for (let id in fields) {
        const set = new Set();
        data.forEach(item => { if(item[fields[id]]) set.add(item[fields[id]]); });
        const el = document.getElementById(id);
        Array.from(set).sort().forEach(val => el.add(new Option(val, val)));
    }
}

function renderCards(data) {
    const grid = document.getElementById('productGrid');
    document.getElementById('count').innerText = data.length;
    
    grid.innerHTML = data.map(item => {
        const priceBRL = parseFloat(item['参考售价 (BRL)']) || 0;
        const refUrl = (item['参考商品链接 (SHP/AE/Amazon/独立站/...)'] || '').trim();
        const hasUrl = refUrl.length > 5;
        const priority = item['Priority'] || 'P2';
        
        return `
        <div class="card ${priority}">
            <div class="priority-badge">${priority}</div>
            <div class="img-container">
                <img class="card-img" src="${item['参考图片链接'] || ''}" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            </div>
            <div class="card-content">
                <div class="category">${item.L1 || ''} ${item.L2 ? ' > ' + item.L2 : ''}</div>
                ${item['商品描述 (名称)'] ? `<div class="title">${item['商品描述 (名称)']}</div>` : ''}
                <div class="price-section">
                    <div class="main-price"><small style="font-size:10px; font-weight:normal">建议售价</small> R$ ${priceBRL.toFixed(2)}</div>
                    <div class="sub-price">约 ¥ ${(priceBRL * EXCHANGE_RATE.CNY).toFixed(2)} | $ ${(priceBRL * EXCHANGE_RATE.USD).toFixed(2)}</div>
                </div>
                <a href="${hasUrl ? refUrl : 'javascript:void(0)'}" 
                   class="btn-main ${hasUrl ? '' : 'disabled'}" 
                   target="_blank">参考链接</a>
            </div>
        </div>
        `;
    }).join('');
}

function filterData() {
    const p = document.getElementById('priorityFilter').value;
    const c = document.getElementById('clusterFilter').value;
    const l1 = document.getElementById('l1Filter').value;
    const l2 = document.getElementById('l2Filter').value;
    const t = document.getElementById('typeFilter').value;

    const filtered = allData.filter(item => {
        return (p === "" || item.Priority === p) &&
               (c === "" || item.Cluster === c) &&
               (l1 === "" || item.L1 === l1) &&
               (l2 === "" || item.L2 === l2) &&
               (t === "" || item['建议卖家类型 (3PF/SLS/不限)'] === t);
    });
    renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    ['priorityFilter', 'clusterFilter', 'l1Filter', 'l2Filter', 'typeFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', filterData);
    });
    document.getElementById('resetBtn').addEventListener('click', () => window.location.reload());
});
