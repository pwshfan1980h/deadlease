// Shared keyboard-only clinic registration for production browser checks.
export async function newGame(page,name='Mara'){
 await page.getByRole('button',{name:'New game',exact:true}).press('Enter');
 await page.getByRole('dialog',{name:'You wake.',exact:true}).waitFor();
 await page.keyboard.press('Escape');
 const command=page.getByRole('textbox',{name:'Command',exact:true});await command.fill('talk clerk');await command.press('Enter');
 await page.getByLabel('Name',{exact:true}).fill(name);await page.keyboard.press('Control+Enter');
 await page.getByLabel('Class',{exact:true}).waitFor();await page.keyboard.press('Control+Enter');
 await page.waitForFunction(()=>!document.querySelector('.clinic-dialog[open]'));
}
