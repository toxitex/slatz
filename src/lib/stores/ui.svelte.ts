export class UiStore {
  searchOpen = $state(false);

  openSearch = () => {
    this.searchOpen = true;
  };

  closeSearch = () => {
    this.searchOpen = false;
  };
}
