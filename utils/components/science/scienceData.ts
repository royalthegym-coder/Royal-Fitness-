// Science Data Registry: Benchmark Biological Targets, Physiological Metadata & Verified Coordinates

export interface BenchmarkTarget {
    geneSymbol: string;
    proteinName: string;
    uniprotId: string;
    pdbId: string;
    category: 'Metabolism & Anabolism' | 'Musculoskeletal' | 'Longevity & DNA Repair' | 'Cardiorespiratory';
    organism: string;
    sequenceLength: number;
    molecularWeightKDa: number;
    physiologicalImpact: string;
    athleticContext: string;
    meanPlddt: number;
    keyDomains: string[];
    catalyticSites?: string[];
    description: string;
    // Verified fallback PDB/CIF coordinate snippet for instant zero-latency preview
    embeddedPdbPreview?: string;
}

export const BENCHMARK_TARGETS: BenchmarkTarget[] = [
    {
        geneSymbol: 'INS',
        proteinName: 'Insulin',
        uniprotId: 'P01308',
        pdbId: '4INS',
        category: 'Metabolism & Anabolism',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 110,
        molecularWeightKDa: 11.98,
        physiologicalImpact: 'Primary hormonal driver of cellular glucose uptake, glycogen synthesis, and systemic amino acid influx into skeletal muscle cells.',
        athleticContext: 'Post-workout insulin sensitivity governs nutrient partitioning: directing carbohydrates and amino acids toward muscle glycogen replenishment and myofibrillar protein synthesis rather than adipose deposition.',
        meanPlddt: 91.4,
        keyDomains: ['Signal peptide (1-24)', 'Insulin B chain (25-54)', 'C-peptide (57-87)', 'Insulin A chain (90-110)'],
        catalyticSites: ['Disulfide bonds (A6-A11, A7-B7, A20-B19)', 'Receptor binding pocket (PheB24, TyrB26)'],
        description: 'Insulin is a peptide hormone produced by beta cells of the pancreatic islets. It maintains normal blood glucose levels by facilitating cellular uptake of glucose and promoting lipogenesis while inhibiting gluconeogenesis and lipolysis.'
    },
    {
        geneSymbol: 'IGF1',
        proteinName: 'Insulin-like Growth Factor 1 (Somatomedin C)',
        uniprotId: 'P05019',
        pdbId: '1GZR',
        category: 'Metabolism & Anabolism',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 195,
        molecularWeightKDa: 21.84,
        physiologicalImpact: 'Potent endocrine and autocrine activator of the PI3K-Akt-mTORC1 cascade, driving ribosomal biogenesis and muscle hypertrophy.',
        athleticContext: 'Eccentric mechanical overload stimulates local autocrine IGF-1Eb (mechano-growth factor), activating quiescent satellite cells to fuse with damaged muscle fibers during post-exercise recovery.',
        meanPlddt: 86.8,
        keyDomains: ['B chain (49-77)', 'C domain (78-89)', 'A chain (90-110)', 'D domain (111-118)', 'E-peptide (119-195)'],
        catalyticSites: ['IGF-1R receptor interaction surface', 'IGFBP binding interface'],
        description: 'A 70-amino acid single-chain polypeptide with structural homology to proinsulin. It stimulates systemic growth, cellular proliferation, and protein synthesis throughout musculoskeletal tissues.'
    },
    {
        geneSymbol: 'ACTB',
        proteinName: 'Actin, Cytoplasmic 1 (Beta-Actin)',
        uniprotId: 'P60709',
        pdbId: '2BTF',
        category: 'Musculoskeletal',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 375,
        molecularWeightKDa: 41.74,
        physiologicalImpact: 'Core ubiquitous globular (G-actin) monomer that polymerizes into filamentous (F-actin) microfilaments, enabling muscle contraction and structural tension.',
        athleticContext: 'Forms the thin filaments in muscle sarcomeres across which myosin heads ratchet during cross-bridge cycling. Heavy eccentric loading causes micro-ruptures along actin-myosin filaments that stimulate cellular remodeling.',
        meanPlddt: 95.2,
        keyDomains: ['Subdomain 1 (Outer domain)', 'Subdomain 2 (Small domain)', 'Subdomain 3 (Inner domain)', 'Subdomain 4 (Large domain)'],
        catalyticSites: ['ATP/ADP binding cleft (Asp11, Gln137)', 'Mg2+ coordination center', 'Profilin binding surface'],
        description: 'Actin is a major structural protein in eukaryotic cells. It alternates between monomeric G-actin and polymeric F-actin states, transducing mechanical forces, cell motility, and muscular power.'
    },
    {
        geneSymbol: 'TP53',
        proteinName: 'Cellular Tumor Antigen p53 (Guardian of the Genome)',
        uniprotId: 'P04637',
        pdbId: '1TUP',
        category: 'Longevity & DNA Repair',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 393,
        molecularWeightKDa: 43.65,
        physiologicalImpact: 'Master transcription factor regulating cell cycle arrest (via p21/CDKN1A), cellular senescence, apoptosis, and mitochondrial DNA surveillance.',
        athleticContext: 'Endurance exercise and caloric restriction stimulate AMP-activated protein kinase (AMPK) and SIRT1, which phosphorylate and deacetylate p53 to induce mitochondrial biogenesis (PGC-1α) and clear damaged organelles via mitophagy.',
        meanPlddt: 74.6,
        keyDomains: ['Transactivation domain (1-61)', 'Proline-rich domain (63-97)', 'DNA-binding core domain (102-292)', 'Tetramerization domain (325-356)', 'C-terminal regulatory domain (363-393)'],
        catalyticSites: ['DNA contact residues (Arg248, Arg273, Arg280)', 'Zinc coordination site (Cys176, His179, Cys238, Cys242)'],
        description: 'p53 is the most frequently mutated tumor suppressor in human cancer. It acts as an emergency brake responding to DNA damage, oxidative stress, hypoxia, and oncogenic signaling to preserve genomic fidelity.'
    },
    {
        geneSymbol: 'MB',
        proteinName: 'Myoglobin',
        uniprotId: 'P02144',
        pdbId: '1MBO',
        category: 'Cardiorespiratory',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 154,
        molecularWeightKDa: 17.18,
        physiologicalImpact: 'Intramuscular oxygen reservoir and carrier protein in slow-twitch Type I and cardiac muscle fibers, buffering cytosolic pO2 during high metabolic demands.',
        athleticContext: 'High-altitude hypoxia and progressive aerobic training elevate muscle myoglobin content, increasing oxygen diffusion gradients from capillaries to mitochondria and delaying the onset of anaerobic glycolysis.',
        meanPlddt: 96.5,
        keyDomains: ['Globin fold (8 alpha-helical segments A through H)'],
        catalyticSites: ['Protoporphyrin IX Heme pocket', 'Proximal Histidine (His93 / F8)', 'Distal Histidine (His64 / E7)'],
        description: 'Myoglobin is a single-chain globular hemoprotein that stores oxygen in muscle tissue. It was the first protein structure ever solved by X-ray crystallography by John Kendrew in 1958.'
    },
    {
        geneSymbol: 'HBB',
        proteinName: 'Hemoglobin Subunit Beta',
        uniprotId: 'P68871',
        pdbId: '4HHB',
        category: 'Cardiorespiratory',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 147,
        molecularWeightKDa: 15.99,
        physiologicalImpact: 'Forms the heterotetrameric (α2β2) oxygen transport complex in erythrocytes, exhibiting cooperative allosteric binding and the Bohr effect.',
        athleticContext: 'Determines systemic oxygen delivery capacity (VO2 max). Erythropoietin (EPO) stimulation from hypoxic adaptation expands total hemoglobin mass, enhancing endurance power output and lactate clearance.',
        meanPlddt: 94.8,
        keyDomains: ['Beta-globin fold', 'Alpha1-Beta1 interface', 'Alpha1-Beta2 allosteric hinge'],
        catalyticSites: ['Heme binding pocket', '2,3-BPG allosteric regulatory site (His2, Lys82, His143)'],
        description: 'Hemoglobin beta subunit binds two alpha chains to form adult hemoglobin (HbA). The allosteric transition between T (deoxygenated) and R (oxygenated) states allows precise oxygen unloading in exercising tissues.'
    },
    {
        geneSymbol: 'MYC',
        proteinName: 'Myc Proto-Oncogene Protein (c-Myc)',
        uniprotId: 'P01106',
        pdbId: '1NKP',
        category: 'Longevity & DNA Repair',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 439,
        molecularWeightKDa: 48.81,
        physiologicalImpact: 'Global transcriptional amplifier governing ribosomal RNA synthesis, glycolysis, glutaminolysis, and cell cycle entry.',
        athleticContext: 'Transient mechanical tension rapidly upregulates c-Myc in skeletal muscle, driving ribosomal biogenesis required to sustain elevated rates of myofibrillar protein synthesis during strength building cycles.',
        meanPlddt: 58.2,
        keyDomains: ['Transactivation domain (1-143)', 'Nuclear localization signal (320-328)', 'Basic helix-loop-helix leucine zipper (bHLH-LZ, 355-439)'],
        catalyticSites: ['MAX dimerization interface', 'E-box consensus DNA sequence binding (CACGTG)'],
        description: 'c-Myc heterodimerizes with MAX through its bHLH-LZ domain to recognize E-box DNA motifs. It contains extensive intrinsically disordered regions (reflected in low AlphaFold pLDDT scores) that adopt folded structure upon MAX binding.'
    },
    {
        geneSymbol: 'BRCA1',
        proteinName: 'Breast Cancer Type 1 Susceptibility Protein',
        uniprotId: 'P38398',
        pdbId: '1JNX',
        category: 'Longevity & DNA Repair',
        organism: 'Homo sapiens (Human)',
        sequenceLength: 1863,
        molecularWeightKDa: 207.72,
        physiologicalImpact: 'Master scaffold coordinating homologous recombination (HR) DNA double-strand break repair, checkpoint signaling, and centrosome duplication.',
        athleticContext: 'Cellular reactive oxygen species (ROS) produced by intense metabolic exertion trigger DNA repair pathways where BRCA1 complexes with BARD1 and RAD51 to maintain telomeric and nuclear DNA integrity.',
        meanPlddt: 52.4,
        keyDomains: ['N-terminal RING finger domain (1-102)', 'Nuclear localization signals (500-600)', 'Tandem BRCT repeat domains (1646-1859)'],
        catalyticSites: ['BARD1 heterodimerization RING interface', 'Phosphopeptide recognition cleft in BRCT tandem repeats'],
        description: 'BRCA1 is an essential tumor suppressor. The structured terminal domains (RING and BRCT) flank a 1,500-residue intrinsically disordered central segment that binds dozens of signaling partners.'
    }
];

export const PLDDT_BANDS = [
    { label: 'Very High', range: '> 90', color: '#0053D6', desc: 'High accuracy for backbone and sidechain rotamers; reliable active sites' },
    { label: 'Confident', range: '70 - 90', color: '#65CBF3', desc: 'Reliable backbone topology and secondary structure; minor sidechain variance' },
    { label: 'Low', range: '50 - 70', color: '#FFDB13', desc: 'Cautious interpretation; typical of flexible loops and inter-domain linkers' },
    { label: 'Very Low', range: '< 50', color: '#FF7D45', desc: 'Intrinsically disordered regions (IDPRs) or unstructured segments' }
];
