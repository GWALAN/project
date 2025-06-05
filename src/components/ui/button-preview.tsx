import React from 'react';
import { Button } from './button';
import { Facebook, Twitter, Github, Mail, Apple, Linkedin, Instagram, Youtube, Twitch, Disc as Discord, Pointer as Pinterest, Snail as Snapchat, Atom as Tiktok, Wheat as Whatsapp, Instagram as Telegram, Edit as Reddit, AlignJustify as Spotify, Slack, Dribbble, Bean as Behance, SunMedium as Medium, PalmtreeIcon as Patreon } from 'lucide-react';

export function ButtonPreview() {
  // Helper function to determine icon size based on screen width
  const iconClass = "sm:w-4 sm:h-4 w-5 h-5";

  return (
    <div className="space-y-8 p-6">
      {/* Default Solid Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Solid Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="alternative">Alternative</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="light">Light</Button>
          <Button variant="green">Green</Button>
          <Button variant="red">Red</Button>
          <Button variant="yellow">Yellow</Button>
          <Button variant="purple">Purple</Button>
          <Button variant="indigo">Indigo</Button>
          <Button variant="orange">Orange</Button>
          <Button variant="amber">Amber</Button>
          <Button variant="lime">Lime</Button>
          <Button variant="emerald">Emerald</Button>
          <Button variant="teal">Teal</Button>
          <Button variant="cyan">Cyan</Button>
          <Button variant="sky">Sky</Button>
          <Button variant="rose">Rose</Button>
          <Button variant="pink">Pink</Button>
          <Button variant="fuchsia">Fuchsia</Button>
          <Button variant="violet">Violet</Button>
        </div>
      </div>

      {/* Outline Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Outline Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline-blue">Blue</Button>
          <Button variant="outline-green">Green</Button>
          <Button variant="outline-red">Red</Button>
          <Button variant="outline-yellow">Yellow</Button>
          <Button variant="outline-purple">Purple</Button>
          <Button variant="outline-indigo">Indigo</Button>
          <Button variant="outline-orange">Orange</Button>
          <Button variant="outline-amber">Amber</Button>
          <Button variant="outline-lime">Lime</Button>
          <Button variant="outline-emerald">Emerald</Button>
          <Button variant="outline-teal">Teal</Button>
          <Button variant="outline-cyan">Cyan</Button>
          <Button variant="outline-sky">Sky</Button>
          <Button variant="outline-rose">Rose</Button>
          <Button variant="outline-pink">Pink</Button>
          <Button variant="outline-fuchsia">Fuchsia</Button>
          <Button variant="outline-violet">Violet</Button>
        </div>
      </div>

      {/* Gradient Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Gradient Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="gradient-blue">Blue</Button>
          <Button variant="gradient-green">Green</Button>
          <Button variant="gradient-cyan">Cyan</Button>
          <Button variant="gradient-teal">Teal</Button>
          <Button variant="gradient-lime">Lime</Button>
          <Button variant="gradient-red">Red</Button>
          <Button variant="gradient-pink">Pink</Button>
          <Button variant="gradient-purple">Purple</Button>
        </div>
      </div>

      {/* Duotone Gradient Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Duotone Gradient Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="gradient-purple-blue">Purple to Blue</Button>
          <Button variant="gradient-cyan-blue">Cyan to Blue</Button>
          <Button variant="gradient-green-blue">Green to Blue</Button>
          <Button variant="gradient-purple-pink">Purple to Pink</Button>
          <Button variant="gradient-pink-orange">Pink to Orange</Button>
          <Button variant="gradient-teal-lime">Teal to Lime</Button>
          <Button variant="gradient-red-yellow">Red to Yellow</Button>
        </div>
      </div>

      {/* Shadow Gradient Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Shadow Gradient Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="shadow-blue">Blue</Button>
          <Button variant="shadow-green">Green</Button>
          <Button variant="shadow-cyan">Cyan</Button>
          <Button variant="shadow-teal">Teal</Button>
          <Button variant="shadow-lime">Lime</Button>
          <Button variant="shadow-red">Red</Button>
          <Button variant="shadow-pink">Pink</Button>
          <Button variant="shadow-purple">Purple</Button>
        </div>
      </div>

      {/* Social Media Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Social Media Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="facebook" size="sm">
            <Facebook className={iconClass} />
            <span className="ml-2">Facebook</span>
          </Button>
          
          <Button variant="twitter" size="sm">
            <Twitter className={iconClass} />
            <span className="ml-2">Twitter</span>
          </Button>
          
          <Button variant="github" size="sm">
            <Github className={iconClass} />
            <span className="ml-2">Github</span>
          </Button>
          
          <Button variant="google" size="sm">
            <Mail className={iconClass} />
            <span className="ml-2">Google</span>
          </Button>
          
          <Button variant="apple" size="sm">
            <Apple className={iconClass} />
            <span className="ml-2">Apple</span>
          </Button>

          <Button variant="linkedin" size="sm">
            <Linkedin className={iconClass} />
            <span className="ml-2">LinkedIn</span>
          </Button>

          <Button variant="instagram" size="sm">
            <Instagram className={iconClass} />
            <span className="ml-2">Instagram</span>
          </Button>

          <Button variant="youtube" size="sm">
            <Youtube className={iconClass} />
            <span className="ml-2">YouTube</span>
          </Button>

          <Button variant="twitch" size="sm">
            <Twitch className={iconClass} />
            <span className="ml-2">Twitch</span>
          </Button>

          <Button variant="discord" size="sm">
            <Discord className={iconClass} />
            <span className="ml-2">Discord</span>
          </Button>

          <Button variant="pinterest" size="sm">
            <Pinterest className={iconClass} />
            <span className="ml-2">Pinterest</span>
          </Button>

          <Button variant="snapchat" size="sm">
            <Snapchat className={iconClass} />
            <span className="ml-2">Snapchat</span>
          </Button>

          <Button variant="tiktok" size="sm">
            <Tiktok className={iconClass} />
            <span className="ml-2">TikTok</span>
          </Button>

          <Button variant="whatsapp" size="sm">
            <Whatsapp className={iconClass} />
            <span className="ml-2">WhatsApp</span>
          </Button>

          <Button variant="telegram" size="sm">
            <Telegram className={iconClass} />
            <span className="ml-2">Telegram</span>
          </Button>

          <Button variant="reddit" size="sm">
            <Reddit className={iconClass} />
            <span className="ml-2">Reddit</span>
          </Button>

          <Button variant="spotify" size="sm">
            <Spotify className={iconClass} />
            <span className="ml-2">Spotify</span>
          </Button>

          <Button variant="slack" size="sm">
            <Slack className={iconClass} />
            <span className="ml-2">Slack</span>
          </Button>

          <Button variant="dribbble" size="sm">
            <Dribbble className={iconClass} />
            <span className="ml-2">Dribbble</span>
          </Button>

          <Button variant="behance" size="sm">
            <Behance className={iconClass} />
            <span className="ml-2">Behance</span>
          </Button>

          <Button variant="medium" size="sm">
            <Medium className={iconClass} />
            <span className="ml-2">Medium</span>
          </Button>

          <Button variant="patreon" size="sm">
            <Patreon className={iconClass} />
            <span className="ml-2">Patreon</span>
          </Button>
        </div>
      </div>

      {/* Button Sizes */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Button Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="default">Small</Button>
          <Button size="default" variant="default">Default</Button>
          <Button size="lg" variant="default">Large</Button>
          <Button size="xl" variant="default">Extra Large</Button>
        </div>
      </div>
    </div>
  );
}