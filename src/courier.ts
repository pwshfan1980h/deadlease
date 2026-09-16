export interface DeliveryRoute {id:string;from:string;to:string;name:string;cargo:string;credits:number;xp:number}
export interface CourierState {route:string|null;completed:number}
export const deliveryRoutes:Record<string,DeliveryRoute>={
 'clinic-run':{id:'clinic-run',from:'yard',to:'clinic',name:'Clinic supply run',cargo:'sterile dressings',credits:14,xp:8},
 'freight-return':{id:'freight-return',from:'clinic',to:'yard',name:'Freight return',cargo:'repaired instruments',credits:14,xp:8},
 'bellwether-run':{id:'bellwether-run',from:'yard',to:'bellwether-1',name:'Bellwether dispatch',cargo:'water filters and machine seals',credits:90,xp:35},
 'district-return':{id:'district-return',from:'bellwether-1',to:'yard',name:'District dispatch',cargo:'field samples and letters',credits:90,xp:35}
};
