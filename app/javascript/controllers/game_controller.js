import { Controller } from "@hotwired/stimulus"
import { launchGame } from "../game/config"

export default class extends Controller {
    connect() {
        // 1. VERIFY STIMULUS IS RUNNING
        console.log("✅ [1] Stimulus Controller connected! The JS bundle is working.");

        // Check if the element actually exists
        console.log("Element ID:", this.element.id);

        this.game = launchGame(this.element.id);
    }

    disconnect() {
        console.log("❌ Stimulus disconnected");
        if (this.game) {
            this.game.destroy(true);
        }
    }
}