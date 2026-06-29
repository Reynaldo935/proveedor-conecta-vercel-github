import re

with open('src/data/mega-catalog.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# English keyword mapping for Spanish tags
TRANS_MAP = {
    'cemento': 'cement', 'construcción': 'construction', 'varilla': 'steel rebar',
    'hierro': 'iron', 'zinc': 'zinc roof', 'techo': 'roof', 'bloque': 'concrete block',
    'paredes': 'wall', 'tubería': 'pipe', 'pvc': 'pvc pipe', 'agua': 'water',
    'arena': 'sand', 'piedrín': 'gravel', 'concreto': 'concrete',
    'martillo': 'hammer', 'herramientas': 'tools', 'taladro': 'drill',
    'eléctrico': 'electric', 'sierra': 'saw', 'pintura': 'paint',
    'látex': 'latex paint', 'blanca': 'white', 'aceite': 'oil paint',
    'roja': 'red', 'cerámica': 'ceramic tile', 'piso': 'floor',
    'ladrillo': 'brick', 'arcilla': 'clay', 'cal': 'lime',
    'clavos': 'nails', 'ferretería': 'hardware', 'alambre': 'wire',
    'puerta': 'door', 'madera': 'wood', 'ventana': 'window',
    'aluminio': 'aluminum', 'pega': 'adhesive', 'azulejo': 'tile',
    'arroz': 'rice', 'frijoles': 'beans', 'maíz': 'corn',
    'azúcar': 'sugar', 'café': 'coffee', 'molido': 'ground coffee',
    'aceite vegetal': 'vegetable oil', 'harina': 'flour', 'trigo': 'wheat',
    'leche': 'milk', 'polvo': 'powder', 'sal': 'salt',
    'cerveza': 'beer', 'ron': 'rum', 'gaseosa': 'soda',
    'snacks': 'snacks', 'galletas': 'cookies', 'chocolate': 'chocolate',
    'laptop': 'laptop', 'computadora': 'computer', 'hp': 'hp laptop',
    'dell': 'dell computer', 'ram': 'ram memory', 'ssd': 'ssd drive',
    'monitor': 'monitor screen', 'led': 'led display', 'teclado': 'keyboard',
    'mouse': 'computer mouse', 'impresora': 'printer', 'router': 'wifi router',
    'tablet': 'tablet', 'celular': 'phone', 'smartphone': 'smartphone',
    'audífonos': 'headphones', 'parlante': 'speaker', 'bluetooth': 'bluetooth speaker',
    'cable': 'cable', 'usb': 'usb cable', 'hdmi': 'hdmi cable',
    'fertilizante': 'fertilizer', 'urea': 'urea fertilizer', 'semilla': 'seeds',
    'frijol': 'beans', 'sorgo': 'sorghum grain',
    'abono': 'compost', 'herbicida': 'herbicide', 'insecticida': 'insecticide',
    'mochila': 'backpack sprayer', 'fumigar': 'spraying', 'manguera': 'hose',
    'pala': 'shovel', 'machete': 'machete', 'carreta': 'cart',
    'botas': 'boots', 'hule': 'rubber', 'sombrero': 'hat',
    'camisa': 'shirt', 'pantalón': 'pants', 'jeans': 'jeans',
    'zapatos': 'shoes', 'tenis': 'sneakers', 'cuero': 'leather',
    'tela': 'fabric', 'algodón': 'cotton', 'poliéster': 'polyester fabric',
    'uniforme': 'uniform', 'escolar': 'school', 'ropa': 'clothing',
    'mueble': 'furniture', 'silla': 'chair', 'mesa': 'table',
    'sofá': 'sofa couch', 'cama': 'bed', 'colchón': 'mattress',
    'estufa': 'stove', 'cocina': 'kitchen', 'refrigerador': 'refrigerator',
    'lavadora': 'washing machine', 'olla': 'pot', 'sartén': 'pan',
    'plato': 'plate', 'vaso': 'glass cup', 'cubierto': 'cutlery',
    'cortina': 'curtain', 'toalla': 'towel', 'sábana': 'bedsheet',
    'panel solar': 'solar panel', 'batería': 'battery', 'inversor': 'inverter',
    'gasolina': 'gasoline', 'diésel': 'diesel fuel', 'lubricante': 'lubricant oil',
    'linterna': 'flashlight', 'foco': 'light bulb', 'extensión': 'extension cord',
    'balón': 'ball', 'fútbol': 'soccer', 'béisbol': 'baseball',
    'raqueta': 'racket', 'natación': 'swimming', 'gimnasio': 'gym',
    'pesa': 'weight', 'bicicleta': 'bicycle', 'yoga': 'yoga mat',
    'colchoneta': 'exercise mat', 'uniforme deportivo': 'sports uniform',
    'shampoo': 'shampoo', 'acondicionador': 'conditioner', 'crema': 'cream',
    'perfume': 'perfume fragrance', 'maquillaje': 'makeup', 'labial': 'lipstick',
    'esmalte': 'nail polish', 'loción': 'lotion', 'jabón': 'soap',
    'cepillo': 'brush', 'peine': 'comb', 'secador': 'hair dryer',
    'auto': 'car', 'vehículo': 'vehicle', 'camioneta': 'pickup truck',
    'moto': 'motorcycle', 'llanta': 'tire', 'repuesto': 'auto part',
    'amortiguador': 'shock absorber', 'filtro': 'filter', 'escáner': 'obd scanner',
    'cargador': 'charger', 'kit herramientas auto': 'auto tool kit',
    'medicina': 'medicine', 'farmacia': 'pharmacy', 'pastilla': 'pill',
    'jarabe': 'syrup', 'vitamina': 'vitamin', 'suplemento': 'supplement',
    'termómetro': 'thermometer', 'tensiómetro': 'blood pressure monitor',
    'jeringa': 'syringe', 'guante': 'glove', 'mascarilla': 'face mask',
    'alcohol': 'alcohol', 'gasas': 'gauze', 'curita': 'bandage',
    'cuaderno': 'notebook', 'papel': 'paper', 'bolígrafo': 'pen',
    'lápiz': 'pencil', 'marcador': 'marker', 'pizarra': 'whiteboard',
    'calculadora': 'calculator', 'plastilina': 'play dough',
    'archivador': 'file folder', 'tijeras': 'scissors',
    'oficina': 'office', 'escritorio': 'desk', 'ejecutiva': 'executive chair',
    'ups': 'ups battery', 'proyector': 'projector', 'teléfono ip': 'ip phone',
    'archivo metálico': 'filing cabinet',
    'hamaca': 'hammock', 'cerámica negra': 'black pottery',
    'artesanal': 'handmade craft', 'bolso': 'leather bag',
    'atrapasueños': 'dream catcher', 'mantel': 'embroidered tablecloth',
    'rosario': 'rosary', 'acrílica': 'acrylic paint',
    'hilo': 'yarn', 'tejer': 'knitting', 'crochet': 'crochet',
    'manta': 'blanket', 'almohadones': 'cushion',
    'escultura': 'wood carving', 'cedro': 'cedar wood',
    'impresión': 'printing', 'tarjetas presentación': 'business cards',
    'banner': 'banner printing', 'flyers': 'flyers', 'publicitario': 'advertising',
    'vinil': 'vinyl sticker', 'sticker': 'sticker', 'sublimada': 'sublimation mug',
    'camiseta': 't-shirt', 'sublimable': 'sublimation blank',
    'plotter': 'vinyl cutter', 'sello': 'stamp seal',
    'papel fotográfico': 'photo paper',
    'botellón': 'water bottle', 'extintor': 'fire extinguisher',
    'candado': 'padlock', 'caja plástica': 'plastic container',
    'lámpara emergencia': 'emergency light', 'botiquín': 'first aid kit',
    'manguera jardín': 'garden hose', 'termo': 'thermos',
    'hielo': 'ice', 'lentes seguridad': 'safety glasses',
    'toyota': 'toyota', 'hilux': 'hilux', '4x4': '4x4 truck',
    'suzuki': 'suzuki car', 'alto': 'suzuki alto', 'económico': 'economy car',
    'todo terreno': 'off road', '850cca': 'car battery',
    '20w50': 'engine oil', 'yamaha': 'yamaha', 'ybr125': 'yamaha motorcycle',
    'oem': 'genuine part', '12v': '12 volt', '10a': '10 amp',
    '40pcs': 'tool kit', 'obd2': 'obd2 scanner',
    'rastrillo': 'rake', 'azadón': 'hoe', '50kg': 'sack',
    'floración': 'blooming', 'yute': 'jute sack', 'granos': 'grains',
    'melaza': 'molasses', 'ganado': 'cattle feed',
    'litio': 'lithium battery', '100ah': 'deep cycle battery',
    'thhn': 'electrical wire', '5000w': 'power inverter',
    '500w': 'solar inverter', '200ah': 'gel battery',
    'lentes natación': 'swim goggles', 'antivaho': 'anti fog',
    'voleibol': 'volleyball net', 'profesional': 'professional',
    'delantero': 'front shock', 'diagnóstico': 'diagnostic tool',
    '12 colores': 'color set', 'permanente': 'permanent',
    'acero inoxidable': 'stainless steel', 'blackout': 'blackout curtains',
    'térmicas': 'thermal', 'nuevo': 'new', 'garantía': 'warranty',
    'canal': 'canal cement', 'portland': 'portland cement',
    'corrugado': 'corrugated steel', 'acanalada': 'corrugated zinc',
    'vibrocomprimido': 'concrete block', 'sdr-26': 'pvc pipe',
    'gruesa': 'coarse sand', 'triturado': 'crushed stone',
    'forjado': 'forged steel', 'fibra de vidrio': 'fiberglass',
    'inalámbrico': 'cordless', 'circular': 'circular saw',
    'acrílica': 'acrylic', 'esmaltada': 'glazed ceramic',
    'cocida': 'fired clay', 'hidratada': 'hydrated lime',
    'recocido': 'annealed wire', 'sólida': 'solid wood',
    'corrediza': 'sliding window', 'mosquitero': 'screen window',
    'adhesivo': 'adhesive', 'multigrado': 'multigrade oil',
    'original': 'genuine oem', 'automático': 'automatic',
    'sobrecarga': 'overload protection', 'sprayer': 'sprayer',
}

def translate_tag(tag):
    tag = tag.strip().lower()
    if tag in TRANS_MAP:
        return TRANS_MAP[tag]
    return tag

def get_keywords(tags_str, product_id):
    tags = [t.strip() for t in tags_str.split(',')]
    english = []
    for tag in tags[:3]:
        english.append(translate_tag(tag))
    # Add product ID for uniqueness
    english.append(product_id.replace('-', ''))
    return ','.join(english[:4])

lines = content.split('\n')
result_lines = []
count = 0

for line in lines:
    img_match = re.search(r'https://picsum\.photos/seed/[^/]+/400/400', line)
    tags_match = re.search(r'tags:"([^"]+)"', line)
    id_match = re.search(r'id:"([^"]+)"', line)
    
    if img_match and tags_match and id_match:
        keywords = get_keywords(tags_match.group(1), id_match.group(1))
        new_url = f'https://loremflickr.com/400/400/{keywords}'
        line = line.replace(img_match.group(0), new_url)
        count += 1
    
    result_lines.append(line)

new_content = '\n'.join(result_lines)
with open('src/data/mega-catalog.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Replaced {count} images with Lorem Flickr real photos')
