function setupEventsFiltering(container) {
	const EVENT_CATS = {
		"academic": "academic",
		"public": "public",
		"media & interviews": "media"
	};

	const $container = $(container);
	
	// 1. Find the event blocks (each .block-content with a header matching one of our categories)
	const eventBlocks = [];
	$container.find('.block-content').each(function() {
		const headerText = $(this).find('.sub-title h2').first().text().trim().toLowerCase();
		if (EVENT_CATS.hasOwnProperty(headerText)) {
			eventBlocks.push({ $block: $(this), slug: EVENT_CATS[headerText], name: $(this).find('.sub-title h2').first().text().trim() });
		}
	});
	
	if (eventBlocks.length === 0) return; // no events to process

	// 2. Collect all cards, tagged with category, paired with their date for sorting
	const allCards = [];
	eventBlocks.forEach(({ $block, slug }) => {
		$block.find('.section').each(function() {
			const $card = $(this);
			$card.attr('data-category', slug);
			const dateText = $card.find('.label-date').text().trim();
			allCards.push({ $card, dateText, sortKey: new Date(dateText + " 1").getTime() || 0 });
		});
	});

	// 3. Sort newest first
	allCards.sort((a, b) => b.sortKey - a.sortKey);

	// 4. Build a new unified block to replace the three originals
	const filterBarHtml = `
		<div class="row"><div class="col-md-12">
			<div class="filter-bar">
				<button class="filter-btn active" data-filter="all">All</button>
				${eventBlocks.map(b => `<button class="filter-btn" data-filter="${b.slug}">${b.name}</button>`).join('')}
			</div>
		</div></div>
	`;

	const headersHtml = `
		<div class="row"><div class="col-md-12"><div class="sub-title mb-40">
			${eventBlocks.map(b => `<h2 class="uppercase category-header" data-category="${b.slug}">${b.name}</h2>`).join('')}
		</div></div></div>
	`;

	const $unified = $('<div class="block-content mb-80"></div>');
	$unified.append(filterBarHtml);
	$unified.append(headersHtml);
	const $cardsRow = $('<div class="row"><div class="col-md-12 col-sm-12 left-align"></div></div>');
	allCards.forEach(({ $card }) => $cardsRow.find('.left-align').append($card));
	$unified.append($cardsRow);

	// 5. Insert before the first event block, then remove all the originals
	eventBlocks[0].$block.before($unified);
	eventBlocks.forEach(({ $block }) => $block.remove());

	// 6. Wire up filter clicks
	$unified.find('.filter-btn').on('click', function() {
		const filter = $(this).data('filter');
		$unified.find('.filter-btn').removeClass('active');
		$(this).addClass('active');
		document.body.dataset.activeFilter = filter;
		renderPageTableOfContents("talks");
	});
	document.body.dataset.activeFilter = "all";
}
