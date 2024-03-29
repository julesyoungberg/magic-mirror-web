export type Filter = {
    path: string;
    annotations: number[][];
    height: number;
    width: number;
};

export const FILTERS: Record<string, Filter> = {
    skeleton: {
        path: "./images/skeleton.png",
        annotations: [
            // Outer lips
            [725, 505],
            [737, 527],
            [764, 527],
            [793, 527],
            [829, 527],
            [839, 510],
            [834, 494],
            [807, 497],
            [771, 494],
            [737, 488],
            // Nose
            [779, 353],
            [781, 382],
            [779, 408],
            [739, 405],
            [755, 416],
            [800, 418],
            [815, 405],
            // Left Eye
            [815, 337],
            [826, 307],
            [851, 295],
            [870, 303],
            [880, 340],
            [870, 375],
            [846, 385],
            [827, 378],
            // Right Eye
            [745, 332],
            [738, 296],
            [718, 283],
            [698, 294],
            [680, 328],
            [694, 370],
            [715, 374],
            [738, 362],
            // Outer Oval
            [797, 170],
            [850, 188],
            [887, 232],
            [907, 292],
            [911, 358],
            [898, 416],
            [882, 476],
            [862, 530],
            [850, 565],
            [780, 575],
            [738, 565],
            [696, 534],
            [670, 472],
            [655, 410],
            [636, 340],
            [655, 279],
            [688, 228],
            [730, 190],
        ],
        height: 2160,
        width: 1620,
    },
};
