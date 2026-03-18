const EXCHANGE_RATE = { CNY: 1.42, USD: 0.20 };
let allData = [];

// 辅助函数：安全获取列数据（处理表头可能的空格或变体）
function getVal(item, keyPart) {
    const targetKey = Object.keys(item).find(k => k.includes(keyPart));
    return item[targetKey] || "";
}

async function init() {
    try {
        const configRes = await fetch('./config.json');
        const config = await configRes.json();
        document.getElementById('siteTitle').innerText = config.siteTitle;
        document.getElementById('siteDesc').innerText = config.siteDesc;

        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // 处理并排序数据
                allData = results.data
                    .map(row => {
                        const n = {};
                        for (let k in row) n[k.trim()] = row[k];
                        return n;
                    })
                    .sort((a, b) => {
                        // 1. 优先级排序 (P0 > P1 > P2)
                        const pA = getVal(a, "Priority"), pB = getVal(b, "Priority");
                        if (pA !== pB) {
                            if (pA === "P0") return -1;
                            if (pB === "P0") return 1;
                            return pA.localeCompare(pB);
                        }
                        // 2. 信息齐全度排序 (有描述且有链接的排前面)
                        const score = (item) => {
                            let s = 0;
                            if (getVal(item, "商品描述").length > 0) s += 2;
                            if (getVal(item, "参考商品链接").length > 5) s += 1;
                            return s;
                        };
                        return score(b) - score(a);
                    });

                updateFilters(allData);
                renderCards(allData);
            }
        });
    } catch (err) { console.error(err); }
}

function updateFilters(data) {
    const selectors = {
        priorityFilter: "Priority",
        clusterFilter: "Cluster",
        l1Filter: "L1",
        l2Filter: "L2",
        typeFilter: "建议卖家类型"
    };

    for (let id in selectors) {
        const set = new Set();
        data.forEach(item => {
            const val = getVal(item, selectors[id]);
            if(val) set.add(val);
        });
        const el = document.getElementById(id);
        Array.from(set).sort().forEach(v => el.add(new Option(v, v)));
    }
}

function renderCards(data) {
    const grid = document.getElementById('productGrid');
    document.getElementById('count').innerText = data.length;
    
    grid.innerHTML = data.map(item => {
        const priority = getVal(item, "Priority") || "P2";
        const priceBRL = parseFloat(getVal(item, "参考售价 (BRL)")) || 0;
        const refUrl = getVal(item, "参考商品链接").trim();
        const hasUrl = refUrl.length > 5;
        const title = getVal(item, "商品描述 (名称)");
        
        return `
        <div class="card ${priority}">
            <div class="priority-badge">${priority}</div>
            <div class="img-container">
                <img class="card-img" src="${getVal(item, "参考图片链接")}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
            </div>
            <div class="card-content">
                <div class="category">${getVal(item, "L1")} ${getVal(item, "L2") ? ' > ' + getVal(item, "L2") : ''}</div>
                <div class="title">${title}</div> <div class="price-section">
                    <div class="main-price"><small style="font-size:10px; font-weight:normal; opacity:0.7">建议售价</small> R$ ${priceBRL.toFixed(2)}</div>
                    <div class="sub-price">¥ ${(priceBRL * EXCHANGE_RATE.CNY).toFixed(2)} | $ ${(priceBRL * EXCHANGE_RATE.USD).toFixed(2)}</div>
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
        return (p === "" || getVal(item, "Priority") === p) &&
               (c === "" || getVal(item, "Cluster") === c) &&
               (l1 === "" || getVal(item, "L1") === l1) &&
               (l2 === "" || getVal(item, "L2") === l2) &&
               (t === "" || getVal(item, "建议卖家类型") === t);
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
