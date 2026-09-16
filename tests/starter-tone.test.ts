import {it,expect} from 'vitest';
import {rooms} from '../src/world';
it('every safe refuge is protected by calm armed human guards',()=>{
 for(const room of Object.values(rooms).filter(r=>r.safe)){expect(room.enemy).toBe('');expect(room.guard).toContain('armed human');expect(room.guard).toContain('calm')}
});
import {enemyFor} from '../src/engine';
it('District67 features low-threat wildlife on the original tutorial route',()=>{
 expect(rooms.alley.enemy).toBe('scrap weasel');
 expect(rooms.sump.enemy).toBe('sump toad');
 for(const id of ['alley','sump']){expect(enemyFor(id).damage).toBeLessThanOrEqual(6);expect(enemyFor(id).maxHP).toBeLessThanOrEqual(28)}
 expect(rooms.alley.description).toContain('weasel');expect(rooms.sump.description).toContain('toad');
});
