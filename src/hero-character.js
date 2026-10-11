import { createAvatarBody } from './avatar-body.js';
import { loadApprovedHead } from './approved-avatar.js';
export { walkPath, heroGreeting, waveMotion, chairRise } from './avatar-body.js';
export async function createHeroCharacter(helpers,seated=false){
  const headTemplate=await loadApprovedHead();
  return createAvatarBody({...helpers,headTemplate},seated);
}
