import { productRepository, orderRepository } from '../repository';
import { Product } from '../entities/product.entity';

export interface PlaceCategorySummary {
    id: string;
    name: string;
    productCount: number;
}

export interface PlaceProductsFilter {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'popular' | 'price-asc' | 'price-desc' | 'newest' | 'rating';
    page?: number;
    limit?: number;
}

export interface PlaceSummary {
    id: string;
    name: string;
    origin: string;
    description: string;
    image: string;
    itemCount: number;
    soldCount: number;
    activeCategoriesCount?: number;
}

export const VERIFIED_PLACE_DESCRIPTIONS: Record<string, string> = {
    bhaktapur: 'Famed for traditional agro-produce, sweet cured curd (Juju Dhau), fresh organic clay-soil vegetables, and heritage spices.',
    chitwan: 'The agricultural heartland of Nepal, renowned for rich honey, cold-pressed mustard oil, and fertile lowlands crops.',
    damak: 'A bustling eastern agricultural hub bringing organic tea, winter citrus, and grain varieties from Jhapa plains.',
    dang: 'An expansive inner-terai valley celebrated for authentic pulses, organic mustard seed, and indigenous cereal crops.',
    ilam: 'The tea capital of the Himalayas, blessed with misty mountain slopes producing world-class orthodox teas and ginger.',
    jhapa: 'Nepal’s eastern agricultural granary, harvesting aromatic Basmati rice, betel nut, and rich seasonal subtropical produce.',
    kathmandu: 'The vibrant historic valley connecting peri-urban terrace farms, seasonal green produce, and fresh culinary herbs.',
    kavre: 'Fertile mid-hill valleys producing abundant fresh dairy, seasonal greens, sweet potatoes, and organic valley vegetables.',
    kullu: 'Nestled in the high alpine valleys, renowned for crisp high-altitude organic apples, walnuts, and mountain honey.',
    mustang: 'High-altitude Himalayan rain shadow terrain producing legendary crunchy Mustang apples, dried slices, and herbal buckwheat.',
    nepalgunj: 'Western plains gateway famous for aromatic spices, lentils, cold-pressed oils, and sun-ripened summer fruits.',
    nuwakot: 'Historic hill terraces famed for organic ginger, sweet mountain radishes, and vibrant citrus orchards.',
    palpa: 'Scenic mid-western hills renowned for hand-ground heritage coffee, ginger flakes, and traditional hill pulse delicacies.',
    siraha: 'Sun-drenched Mithila terroir famous for sweet Malda and Bombay mangoes, seasonal water caltrops, and sweet melons.',
    sunsari: 'Eastern river valley plains yielding sweet bananas, fresh jute greens, sugarcane jaggery, and aromatic pulses.'
};

export class PlaceService {
    private static formatSlug(input: string): string {
        return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    private static getOriginMatch(slugOrName: string): string {
        const cleaned = slugOrName.trim().toLowerCase().replace(/-nepal$|-hp$/, '').replace(/-/g, ' ');
        return cleaned;
    }

    private static getPrettyName(slugOrName: string): string {
        const base = slugOrName.trim().replace(/-nepal$|-hp$/i, '').replace(/,/g, '').split(' ')[0];
        return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    }

    private static parseSalesCount(soldStr: string | number | undefined): number {
        if (!soldStr) return 0;
        if (typeof soldStr === 'number') return soldStr;
        const match = String(soldStr).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    /**
     * Get all places with verified descriptions, product counts, and genuine sold quantities.
     */
    static async getPlaces(): Promise<PlaceSummary[]> {
        // Fetch all active products
        const products = await productRepository.find({
            where: { active: 1 },
            select: ['id', 'origin', 'sold', 'category']
        });

        // Fetch completed/valid orders to compute verified sales
        const orders = await orderRepository.find({
            select: ['id', 'status', 'itemsJson']
        });

        const validOrders = orders.filter(
            o => (o.status || '').toUpperCase() !== 'CANCELLED' && (o.status || '').toUpperCase() !== 'FAILED'
        );
        const salesByProductId = new Map<string, number>();

        for (const order of validOrders) {
            try {
                const items = typeof order.itemsJson === 'string' ? JSON.parse(order.itemsJson) : order.itemsJson;
                if (Array.isArray(items)) {
                    for (const item of items) {
                        const pid = String(item.productId || item.id || '');
                        const qty = Number(item.quantity) || 0;
                        if (pid && qty > 0) {
                            salesByProductId.set(pid, (salesByProductId.get(pid) || 0) + qty);
                        }
                    }
                }
            } catch {
                // Ignore JSON parse errors
            }
        }

        // Aggregate statistics per place
        const placeMap = new Map<string, { count: number; sold: number; categories: Set<string> }>();

        for (const key of Object.keys(VERIFIED_PLACE_DESCRIPTIONS)) {
            placeMap.set(key, { count: 0, sold: 0, categories: new Set<string>() });
        }

        for (const product of products) {
            const originLower = (product.origin || '').toLowerCase();
            for (const key of Object.keys(VERIFIED_PLACE_DESCRIPTIONS)) {
                if (originLower.includes(key)) {
                    const stats = placeMap.get(key)!;
                    stats.count += 1;
                    const verifiedSold = salesByProductId.get(String(product.id)) || 0;
                    const baselineSold = PlaceService.parseSalesCount(product.sold);
                    stats.sold += (verifiedSold + baselineSold);
                    if (product.category) {
                        stats.categories.add(product.category.trim());
                    }
                    break;
                }
            }
        }

        const places: PlaceSummary[] = Object.keys(VERIFIED_PLACE_DESCRIPTIONS).map(key => {
            const stats = placeMap.get(key) || { count: 0, sold: 0, categories: new Set<string>() };
            const prettyName = PlaceService.getPrettyName(key);
            const isKullu = key === 'kullu';
            return {
                id: key,
                name: prettyName,
                origin: `${prettyName}, ${isKullu ? 'HP' : 'Nepal'}`,
                description: VERIFIED_PLACE_DESCRIPTIONS[key],
                image: `/src/assets/images/places/${key}.jpg`,
                itemCount: stats.count,
                soldCount: stats.sold,
                activeCategoriesCount: stats.categories.size
            };
        });

        return places;
    }

    /**
     * Get place metadata by slug or origin string.
     */
    static async getPlaceBySlug(slugOrName: string): Promise<PlaceSummary | null> {
        const cleaned = PlaceService.getOriginMatch(slugOrName);
        let matchedKey: string | null = null;

        for (const key of Object.keys(VERIFIED_PLACE_DESCRIPTIONS)) {
            if (cleaned.includes(key) || key.includes(cleaned)) {
                matchedKey = key;
                break;
            }
        }

        if (!matchedKey) {
            matchedKey = PlaceService.formatSlug(slugOrName);
        }

        const description = VERIFIED_PLACE_DESCRIPTIONS[matchedKey] || `Authentic regional farm harvest from ${PlaceService.getPrettyName(matchedKey)}.`;
        const prettyName = PlaceService.getPrettyName(matchedKey);
        const isKullu = matchedKey === 'kullu';

        const products = await productRepository
            .createQueryBuilder('p')
            .where('p.active = 1')
            .andWhere('LOWER(p.origin) LIKE :originMatch', { originMatch: `%${matchedKey}%` })
            .getMany();

        const orders = await orderRepository.find({ select: ['status', 'itemsJson'] });
        const validOrders = orders.filter(
            o => (o.status || '').toUpperCase() !== 'CANCELLED' && (o.status || '').toUpperCase() !== 'FAILED'
        );
        const salesByProductId = new Map<string, number>();

        for (const order of validOrders) {
            try {
                const items = typeof order.itemsJson === 'string' ? JSON.parse(order.itemsJson) : order.itemsJson;
                if (Array.isArray(items)) {
                    for (const item of items) {
                        const pid = String(item.productId || item.id || '');
                        const qty = Number(item.quantity) || 0;
                        if (pid && qty > 0) {
                            salesByProductId.set(pid, (salesByProductId.get(pid) || 0) + qty);
                        }
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }

        let totalSold = 0;
        const categories = new Set<string>();

        for (const p of products) {
            const verifiedSold = salesByProductId.get(String(p.id)) || 0;
            totalSold += (verifiedSold + PlaceService.parseSalesCount(p.sold));
            if (p.category) {
                categories.add(p.category.trim());
            }
        }

        return {
            id: matchedKey,
            name: prettyName,
            origin: `${prettyName}, ${isKullu ? 'HP' : 'Nepal'}`,
            description,
            image: `/src/assets/images/places/${matchedKey}.jpg`,
            itemCount: products.length,
            soldCount: totalSold,
            activeCategoriesCount: categories.size
        };
    }

    /**
     * Get dynamic categories available strictly within this location (only categories with active products).
     */
    static async getPlaceCategories(slugOrName: string): Promise<PlaceCategorySummary[]> {
        const cleaned = PlaceService.getOriginMatch(slugOrName);
        let matchedKey = cleaned;
        for (const key of Object.keys(VERIFIED_PLACE_DESCRIPTIONS)) {
            if (cleaned.includes(key) || key.includes(cleaned)) {
                matchedKey = key;
                break;
            }
        }

        const rawResults = await productRepository
            .createQueryBuilder('p')
            .select('TRIM(p.category)', 'category')
            .addSelect('COUNT(p.id)', 'count')
            .where('p.active = 1')
            .andWhere('LOWER(p.origin) LIKE :originMatch', { originMatch: `%${matchedKey}%` })
            .groupBy('TRIM(p.category)')
            .having('COUNT(p.id) > 0')
            .orderBy('count', 'DESC')
            .getRawMany();

        return rawResults
            .filter(r => r.category && r.category.trim() !== '')
            .map(r => ({
                id: PlaceService.formatSlug(r.category),
                name: r.category.trim(),
                productCount: parseInt(r.count, 10) || 0
            }));
    }

    /**
     * Get products belonging strictly to this location, with optional category, search, price filtering, sorting, and pagination.
     */
    static async getPlaceProducts(slugOrName: string, filters: PlaceProductsFilter = {}): Promise<{
        products: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const cleaned = PlaceService.getOriginMatch(slugOrName);
        let matchedKey = cleaned;
        for (const key of Object.keys(VERIFIED_PLACE_DESCRIPTIONS)) {
            if (cleaned.includes(key) || key.includes(cleaned)) {
                matchedKey = key;
                break;
            }
        }

        const query = productRepository
            .createQueryBuilder('p')
            .where('p.active = 1')
            .andWhere('LOWER(p.origin) LIKE :originMatch', { originMatch: `%${matchedKey}%` });

        // Category filter (match name or slug)
        if (filters.category && filters.category.trim() !== '' && filters.category.toLowerCase() !== 'all') {
            const cat = filters.category.trim().toLowerCase();
            query.andWhere(
                '(LOWER(p.category) = :cat OR LOWER(REPLACE(p.category, " ", "-")) = :cat)',
                { cat }
            );
        }

        // Search query
        if (filters.search && filters.search.trim() !== '') {
            const searchLower = `%${filters.search.trim().toLowerCase()}%`;
            query.andWhere(
                '(LOWER(p.name) LIKE :search OR LOWER(p.description) LIKE :search)',
                { search: searchLower }
            );
        }

        // Price range
        if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
            query.andWhere('p.price >= :minPrice', { minPrice: filters.minPrice });
        }
        if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
            query.andWhere('p.price <= :maxPrice', { maxPrice: filters.maxPrice });
        }

        // Sorting
        const sort = filters.sort || 'newest';
        switch (sort) {
            case 'price-asc':
                query.orderBy('p.price', 'ASC');
                break;
            case 'price-desc':
                query.orderBy('p.price', 'DESC');
                break;
            case 'rating':
                query.orderBy('p.rating', 'DESC');
                break;
            case 'popular':
                query.orderBy('p.sold', 'DESC').addOrderBy('p.rating', 'DESC');
                break;
            case 'newest':
            default:
                query.orderBy('p.createdAt', 'DESC');
                break;
        }

        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(filters.limit) || 12));
        const skip = (page - 1) * limit;

        const [products, total] = await query.skip(skip).take(limit).getManyAndCount();

        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get Most Popular Products strictly within this place.
     * Computes popularity score = genuine completed order items quantity + baseline sold count.
     */
    static async getPlacePopularProducts(slugOrName: string, limitCount = 4): Promise<Product[]> {
        const cleaned = PlaceService.getOriginMatch(slugOrName);
        let matchedKey = cleaned;
        for (const key of Object.keys(VERIFIED_PLACE_DESCRIPTIONS)) {
            if (cleaned.includes(key) || key.includes(cleaned)) {
                matchedKey = key;
                break;
            }
        }

        const products = await productRepository
            .createQueryBuilder('p')
            .where('p.active = 1')
            .andWhere('LOWER(p.origin) LIKE :originMatch', { originMatch: `%${matchedKey}%` })
            .getMany();

        if (products.length === 0) {
            return [];
        }

        const orders = await orderRepository.find({ select: ['status', 'itemsJson'] });
        const validOrders = orders.filter(
            o => (o.status || '').toUpperCase() !== 'CANCELLED' && (o.status || '').toUpperCase() !== 'FAILED'
        );
        const salesByProductId = new Map<string, number>();

        for (const order of validOrders) {
            try {
                const items = typeof order.itemsJson === 'string' ? JSON.parse(order.itemsJson) : order.itemsJson;
                if (Array.isArray(items)) {
                    for (const item of items) {
                        const pid = String(item.productId || item.id || '');
                        const qty = Number(item.quantity) || 0;
                        if (pid && qty > 0) {
                            salesByProductId.set(pid, (salesByProductId.get(pid) || 0) + qty);
                        }
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }

        // Attach popularity score
        const scored = products.map(product => {
            const verifiedSold = salesByProductId.get(String(product.id)) || 0;
            const baselineSold = PlaceService.parseSalesCount(product.sold);
            const totalScore = verifiedSold + baselineSold;
            return {
                product,
                score: totalScore
            };
        });

        // Filter and sort by score, rating, date
        scored.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (Number(b.product.rating) !== Number(a.product.rating)) {
                return Number(b.product.rating) - Number(a.product.rating);
            }
            return new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime();
        });

        return scored.slice(0, limitCount).map(s => s.product);
    }

    /**
     * Backwards-compatible getPlaceById.
     */
    static async getPlaceById(idOrSlug: string): Promise<PlaceSummary | null> {
        return PlaceService.getPlaceBySlug(idOrSlug);
    }
}

export default PlaceService;
