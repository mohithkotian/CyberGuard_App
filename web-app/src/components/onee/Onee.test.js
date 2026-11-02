import { avatarData } from './onee.avatar.js';
import { loadAvatarRuntime } from './avatar-runtime.js';

describe('Onee Avatar Data & Runtime', () => {
  test('avatarData contains required metadata and 22 animations', () => {
    expect(avatarData.version).toBe(1);
    expect(avatarData.avatar.name).toBe('Onee');
    expect(avatarData.avatar.surface.type).toBe('cone');

    const expectedAnimations = [
      'sleeping', 'waking', 'idle', 'listening', 'thinking', 'searching',
      'working', 'excited', 'bored', 'suspicious', 'angry', 'drowsy',
      'happy', 'curious', 'confused', 'surprised', 'proud', 'sad',
      'laughing', 'scared', 'playful', 'celebrate'
    ];

    expectedAnimations.forEach(animName => {
      expect(avatarData.animations[animName]).toBeDefined();
      expect(Array.isArray(avatarData.animations[animName].steps)).toBe(true);
    });
  });

  test('loadAvatarRuntime resolves avatar module with createAvatar', async () => {
    const runtime = await loadAvatarRuntime(avatarData);
    expect(runtime).toBeDefined();
    expect(typeof runtime.createAvatar).toBe('function');
  });

  test('createAvatar mounts SVG on DOM element', async () => {
    const runtime = await loadAvatarRuntime(avatarData);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const instance = runtime.createAvatar(host, { animation: 'idle', autoplay: false, size: 240 });
    expect(instance).toBeDefined();
    expect(typeof instance.play).toBe('function');
    expect(typeof instance.pause).toBe('function');
    expect(typeof instance.stop).toBe('function');
    expect(typeof instance.destroy).toBe('function');

    const svg = host.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('-150 -150 300 300');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Onee');

    instance.destroy();
    expect(host.children.length).toBe(0);
    document.body.removeChild(host);
  });
});
