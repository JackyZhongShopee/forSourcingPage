// 1. 定义数据源（你的 CSV 文件路径）
const csvUrl = './data/selection.csv'; 

// 2. 使用 PapaParse 加载并解析 CSV
Papa.parse(csvUrl, {
    download: true,
    header: true, // 自动把第一行作为属性名
    complete: function(results) {
        const data = results.data;
        renderGallery(data); // 初始渲染全部商品
        setupFilters(data); // 初始化筛选器
    }
});

// 3. 核心渲染函数：把数据变成 HTML 卡片
function renderGallery(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = ''; // 清空当前展示

    items.forEach(item => {
        // 跳过空行
        if(!item.Priority) return;

        // 创建卡片 HTML 模板
        const card = document.createElement('div');
        card.className = `card ${item.Priority}`; // P0, P1 赋予不同的颜色边框
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${item['参考图片链接']}" alt="${item['商品描述 (名称)']}" loading="lazy">
                <span class="badge">${item.Priority}</span>
            </div>
            <div class="card-info">
                <h3>${item['商品描述 (名称)']}</h3>
                <div class="category-path">${item.L1} > ${item.L2}</div>
                <div class="price-row">
                    <span class="currency">BRL</span>
                    <span class="price">${item['参考售价 (BRL)']}</span>
                </div>
                <div class="tag-row">
                    <span class="tag">${item['建议卖家类型 (3PF/SLS/不限)']}</span>
                    <span class="cluster">${item.Cluster}</span>
                </div>
                <p class="remark">${item.Remark || ''}</p>
                <div class="button-group">
                    <a href="${item['参考商品链接 (SHP/AE/Amazon/独立站/...)']}" target="_blank" class="btn-link">原品链接</a>
                    <button onclick="copyToClipboard('${item['参考图片']}')" class="btn-copy">复制图片ID</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
